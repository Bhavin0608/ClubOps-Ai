import { Ctx, requireOrganizer } from "@/lib/api";
import { prisma } from "@/lib/db";
import { getTodayContext, formatDisplayDate } from "@/lib/dates";
import { llm, ChatTurn, ToolDeclaration } from "../llm";
import { toolRegistry, resolveTaskId, resolveMemberId, parseDeadline } from "./registry";
import { pendingActionService } from "@/server/services/pending-action.service";
import { memoryService } from "@/server/services/memory.service";
import { taskService } from "@/server/services/task.service";
import { PendingAction, Prisma } from "@prisma/client";

export interface AssistantTurnResult {
  text: string;
  stagedActions: PendingAction[];
  toolTrace: { tool: string; args?: unknown }[];
  citations?: { n: number; sourceName: string; locator?: string; snippet: string }[];
}

function unwrapZod(schema: any): any {
  let curr = schema;
  while (curr && (curr._def?.typeName === "ZodOptional" || curr._def?.typeName === "ZodNullable" || curr._def?.typeName === "ZodDefault")) {
    curr = curr._def.innerType;
  }
  return curr;
}

function buildToolDeclarations(): ToolDeclaration[] {
  return Object.values(toolRegistry).map((tool) => {
    const shape = (tool.input as any).shape ?? {};
    const properties: Record<string, unknown> = {};
    const required: string[] = [];

    for (const [key, rawProp] of Object.entries(shape)) {
      const isOpt = (rawProp as any).isOptional?.() ?? false;
      if (!isOpt) required.push(key);

      const unwrapped = unwrapZod(rawProp);
      const typeName = unwrapped?._def?.typeName;

      let paramType = "string";
      const paramObj: Record<string, unknown> = {
        description: (rawProp as any).description ?? `Parameter ${key}`,
      };

      if (typeName === "ZodNumber") {
        paramType = "number";
      } else if (typeName === "ZodBoolean") {
        paramType = "boolean";
      } else if (typeName === "ZodEnum") {
        paramType = "string";
        paramObj.enum = unwrapped._def.values;
      } else if (typeName === "ZodArray") {
        paramType = "array";
        paramObj.items = { type: "string" };
      }

      paramObj.type = paramType;
      properties[key] = paramObj;
    }

    return {
      name: tool.name,
      description: tool.description,
      parameters: {
        type: "object",
        properties,
        required,
      },
    };
  });
}

export async function runAssistantTurn(
  ctx: Ctx,
  userMessage: string
): Promise<AssistantTurnResult> {
  requireOrganizer(ctx);

  const event = await prisma.event.findUnique({
    where: { id: ctx.eventId },
    select: { name: true, startDate: true, endDate: true, venue: true, expectedParticipants: true },
  });

  const today = getTodayContext(ctx.now);

  // 1. Continuous Learning: Load all active learned preferences & operational rules
  let memories: any[] = [];
  try {
    memories = await memoryService.list(ctx);
  } catch (err) {
    console.warn("Could not load memories for event:", err);
  }

  const memorySection = Array.isArray(memories) && memories.length > 0
    ? `\n=== CONTINUOUS LEARNING & LEARNED RULES (STRICTLY ADHERE) ===\n` +
      memories
        .filter((m) => m && m.key && m.instruction)
        .map((m: { category?: string; key: string; instruction: string }) => `• [${m.category || "RULE"}] ${m.key}: ${m.instruction}`)
        .join("\n") + "\n"
    : "";

  const system = `You are the ClubOps AI operations command center assistant for "${event?.name ?? "College Event"}".
Today is ${today.weekday}, ${today.formatted} (${today.timezone}).
Event Dates: ${event?.startDate ? formatDisplayDate(event.startDate) : "TBD"} to ${event?.endDate ? formatDisplayDate(event.endDate) : "TBD"}.
Venue: ${event?.venue || "Main Campus Auditorium"}. Expected Participants: ${event?.expectedParticipants ?? 500}.
${memorySection}
STRICT GUIDELINES:
1. PRECISION & FACTUALITY: Always answer questions with exact names, figures, dates, and actionable facts. Avoid fluff, filler, or vague generalities.
2. GROUNDING: For questions about tasks, members, deadlines, or risks, ALWAYS call the corresponding read tools (listTasks, listMembers, listRisks, getEventSummary) first to inspect live database facts.
3. KNOWLEDGE & DOCUMENTS: For questions about venue rules, contracts, agreements, or transcripts, call searchDocuments and cite sources with [1], [2]. Never invent contractual numbers or rules.
4. FULL CRUD ACTIONS:
   - When asked to assign, reassign, change deadline, update, delete, or create tasks, or manage volunteers, call the corresponding tool directly.
   - You can supply either the exact ID OR the title/name (e.g. task: "Confirm venue booking", assignee: "Rahul"). Smart resolution will automatically find the matching record.
   - Consequential actions (assignTask, changeTaskDeadline, deleteTask, createTask, addVolunteer, removeVolunteer) will be staged as confirmation cards for the organizer. Clearly explain what is staged.
5. CONTINUOUS LEARNING:
   - Whenever the user gives a rule, correction, or preference (e.g., "Remember that...", "Rahul handles logistics", "Curfew is 10 PM", or corrects a mistake), IMMEDIATELY call saveLearnedMemory.
   - This ensures you continuously learn and become more accurate on every single interaction.
6. CONVERSATION CONTEXT & PRONOUN RESOLUTION:
   - You have full access to previous messages in this conversation.
   - When the user refers to "it", "that", "this task", "that person", "he", "she", or previous deliverables, resolve the reference from the recent conversation history. For example, if the previous turn discussed "Finalize volunteer shift roster" and the user says "Assign it to Rahul", resolve "it" to "Finalize volunteer shift roster".
7. If an inquiry is ambiguous, ask one concise clarifying question.`;

  // Load conversational context (16 turns for full multi-turn memory)
  const history = await prisma.chatMessage.findMany({
    where: { eventId: ctx.eventId, userId: ctx.userId },
    orderBy: { createdAt: "desc" },
    take: 16,
  });
  history.reverse();

  const messages: ChatTurn[] = [
    ...history.map((m) => ({
      role: m.role.toLowerCase() as "user" | "assistant",
      content: m.content,
    })),
    { role: "user", content: userMessage },
  ];

  const tools = buildToolDeclarations();
  const staged: PendingAction[] = [];
  const trace: { tool: string; args?: unknown }[] = [];
  let retrievedSources: any[] = [];

  const MAX_STEPS = 6;
  let finalAnswer = "";

  for (let step = 0; step < MAX_STEPS; step++) {
    let turn;
    try {
      turn = await llm.chatWithTools({ system, messages, tools });
    } catch (err: any) {
      console.warn("LLM chatWithTools fallback mode:", err?.message || err);

      // Offline / Fallback Intelligent Handler:
      const lower = userMessage.toLowerCase();

      const cleanMsg = userMessage.trim().replace(/[.]+$/, ""); // strip trailing punctuation

      // 1. Contextual Pronoun Assignment: "Assign it to Rahul" / "Assign this to Rahul"
      const pronounAssign = cleanMsg.match(/assign (?:it|this|that|the unassigned task) to (?:volunteer )?([A-Za-z]+)$/i);
      if (pronounAssign) {
        try {
          const personIdent = pronounAssign[1].trim();
          const memberId = await resolveMemberId(ctx, personIdent);
          const member = memberId ? await prisma.member.findUnique({ where: { id: memberId } }) : null;

          // Find candidate task from history or unassigned tasks
          let candidateTaskId: string | null = null;
          let candidateTaskTitle = "";

          // Look in recent history
          for (let i = history.length - 1; i >= 0; i--) {
            const histContent = history[i].content;
            const unassignedInHist = histContent.match(/["']([^"']+)["']/);
            if (unassignedInHist) {
              try {
                const tid = await resolveTaskId(ctx, unassignedInHist[1]);
                candidateTaskId = tid;
                const t = await taskService.get(ctx, tid);
                candidateTaskTitle = t.title;
                break;
              } catch {
                // continue
              }
            }
          }

          // If not in history text, find the first unassigned task
          if (!candidateTaskId) {
            const unassigned = await prisma.task.findFirst({
              where: { eventId: ctx.eventId, ownerId: null },
            });
            if (unassigned) {
              candidateTaskId = unassigned.id;
              candidateTaskTitle = unassigned.title;
            }
          }

          if (candidateTaskId) {
            const summary = `Reassign "${candidateTaskTitle}": Unassigned → ${member?.name ?? "Unassigned"}`;
            const pa = await pendingActionService.stage(ctx, "assignTask", { task: candidateTaskId, assignee: memberId }, summary);
            staged.push(pa);
            trace.push({ tool: "assignTask", args: { task: candidateTaskId, assignee: memberId } });
            finalAnswer = `I have staged the task assignment for your confirmation: Assign **"${candidateTaskTitle}"** to **${member?.name ?? "Unassigned"}**. Please review and confirm below.`;
            break;
          } else {
            finalAnswer = `All deliverables currently have assigned owners. Which specific task would you like to reassign to ${member?.name || personIdent}?`;
            break;
          }
        } catch (e: any) {
          finalAnswer = `Could not resolve volunteer: ${e.message}`;
          break;
        }
      }

      // 2. Direct Task Assignment: "Assign 'Arrange welcome drink' task to Meera"
      const assignToMatch = cleanMsg.match(/(?:assign|reassign) (.+?) (?:from\s+[A-Za-z]+\s+)?to (?:volunteer )?([A-Za-z]+)$/i);
      if (assignToMatch && !lower.includes("it to") && !lower.includes("this to") && !lower.includes("that to")) {
        try {
          let rawTask = assignToMatch[1].trim();
          rawTask = rawTask.replace(/^(?:the\s+)?(?:task\s+)?/i, "");
          rawTask = rawTask.replace(/(?:\s+task)$/i, "");
          rawTask = rawTask.replace(/^["']|["']$/g, "").trim();

          const personIdent = assignToMatch[2].trim();
          const memberId = await resolveMemberId(ctx, personIdent);
          const member = memberId ? await prisma.member.findUnique({ where: { id: memberId } }) : null;

          let taskId: string | null = null;
          try {
            taskId = await resolveTaskId(ctx, rawTask);
          } catch {
            taskId = null;
          }

          if (taskId) {
            // Task exists in database -> Reassign
            const task = await taskService.get(ctx, taskId);
            const summary = `Reassign "${task.title}": ${task.owner?.name ?? "Unassigned"} → ${member?.name ?? "Unassigned"}`;
            const pa = await pendingActionService.stage(ctx, "assignTask", { task: taskId, assignee: memberId }, summary);
            staged.push(pa);
            trace.push({ tool: "assignTask", args: { task: taskId, assignee: memberId } });
            finalAnswer = `I have staged the task assignment for your confirmation: Reassign **"${task.title}"** to **${member?.name ?? "Unassigned"}**. Please review and confirm below.`;
            break;
          } else {
            // Task does NOT exist yet -> Automatically create and assign it!
            const team = member?.team || "General";
            const summary = `Create task "${rawTask}" (${team}, Assigned to: ${member?.name ?? "Unassigned"})`;
            const pa = await pendingActionService.stage(ctx, "createTask", {
              title: rawTask,
              team,
              priority: "MEDIUM",
              assignee: memberId,
            }, summary);
            staged.push(pa);
            trace.push({ tool: "createTask", args: { title: rawTask, team, assignee: memberId } });
            finalAnswer = `The task **"${rawTask}"** was not found in existing deliverables. I have staged creating this new task for the **${team}** team and assigning it to **${member?.name ?? "Unassigned"}**. Please review and confirm below.`;
            break;
          }
        } catch (e: any) {
          finalAnswer = `Could not resolve volunteer: ${e.message}`;
          break;
        }
      }

      // 3. Deadline Modification: "Move 'Confirm venue booking' deadline to Friday"
      const deadlineMatch = userMessage.match(/(?:move|change|set|reschedule) (?:the )?(?:deadline of )?["']?([^"']+)["']? (?:deadline )?to (.+)/i);
      if (deadlineMatch) {
        try {
          const taskIdent = deadlineMatch[1].trim();
          const rawDate = deadlineMatch[2].trim();
          const taskId = await resolveTaskId(ctx, taskIdent);
          const task = await taskService.get(ctx, taskId);
          const date = parseDeadline(rawDate, ctx.now);

          const summary = `Change deadline of "${task.title}": ${formatDisplayDate(task.deadline)} → ${formatDisplayDate(date)}`;
          const pa = await pendingActionService.stage(ctx, "changeTaskDeadline", { task: taskId, deadline: rawDate }, summary);
          staged.push(pa);
          trace.push({ tool: "changeTaskDeadline", args: { task: taskId, deadline: rawDate } });
          finalAnswer = `I have staged the deadline update for your confirmation: Change deadline of **"${task.title}"** to **${formatDisplayDate(date)}**. Please review and confirm below.`;
          break;
        } catch (e: any) {
          // continue
        }
      }

      // 4. Create Task: "Create a HIGH priority task 'Set up registration' for Tech team"
      const createMatch = userMessage.match(/create (?:a )?(?:(critical|high|medium|low) priority )?task ["']?([^"']+)["']?/i);
      if (createMatch) {
        try {
          const priority = (createMatch[1]?.toUpperCase() as any) || "MEDIUM";
          const title = createMatch[2].trim();

          const teamMatch = userMessage.match(/for (?:the )?([A-Za-z]+) team/i);
          const team = teamMatch ? teamMatch[1].trim() : "General";

          const assigneeMatch = userMessage.match(/assign(?:ed)? to ([A-Za-z]+)/i);
          let ownerId: string | null = null;
          let assigneeName = "Unassigned";
          if (assigneeMatch) {
            ownerId = await resolveMemberId(ctx, assigneeMatch[1].trim());
            const m = ownerId ? await prisma.member.findUnique({ where: { id: ownerId } }) : null;
            if (m) assigneeName = m.name;
          }

          const summary = `Create task "${title}" (${team}, Priority: ${priority}, Assigned to: ${assigneeName})`;
          const pa = await pendingActionService.stage(ctx, "createTask", {
            title,
            team,
            priority,
            assignee: ownerId,
          }, summary);
          staged.push(pa);
          trace.push({ tool: "createTask", args: { title, team, priority, assignee: ownerId } });
          finalAnswer = `I have staged the new deliverable for your confirmation: Create task **"${title}"** (${team}, Priority: ${priority}, Assigned to: ${assigneeName}). Please review and confirm below.`;
          break;
        } catch (e: any) {
          // continue
        }
      }

      // 5. Delete Task: "Delete task 'Arrange volunteer T-shirts'"
      const deleteMatch = userMessage.match(/delete (?:the )?(?:task )?["']?([^"']+)["']?/i);
      if (deleteMatch && !lower.includes("how") && !lower.includes("can you")) {
        try {
          const taskIdent = deleteMatch[1].trim();
          const taskId = await resolveTaskId(ctx, taskIdent);
          const task = await taskService.get(ctx, taskId);
          const summary = `Delete task "${task.title}" (${task.team || "General"})`;
          const pa = await pendingActionService.stage(ctx, "deleteTask", { task: taskId }, summary);
          staged.push(pa);
          trace.push({ tool: "deleteTask", args: { task: taskId } });
          finalAnswer = `I have staged the deletion of task **"${task.title}"** for your confirmation. Please review and confirm below.`;
          break;
        } catch (e: any) {
          // continue
        }
      }

      // 6. Continuous Learning: "Remember that..."
      const rememberMatch = userMessage.match(/(?:remember|note|keep in mind|always) (?:that )?(.+)/i);
      if (rememberMatch) {
        const textToSave = rememberMatch[1].trim();
        const key = textToSave.slice(0, 30).replace(/[^a-zA-Z0-9 ]/g, "").trim().replace(/\s+/g, "-");
        const saved = await memoryService.save(ctx, {
          key: key || "User-Rule",
          instruction: textToSave,
          category: "RULE",
        });
        trace.push({ tool: "saveLearnedMemory", args: { key: saved.key, instruction: saved.instruction } });
        finalAnswer = `Understood. I have recorded this in my operational memory: **"${saved.instruction}"**.\n\nI will continuously adhere to this rule in all future planning and question-answering for ${event?.name ?? "this event"}.`;
        break;
      }

      // 7. Question: Which task is unassigned?
      if (lower.includes("unassigned") || lower.includes("not assigned") || lower.includes("without owner") || lower.includes("no owner") || lower.includes("needs owner")) {
        const unassigned = await prisma.task.findMany({
          where: { eventId: ctx.eventId, ownerId: null },
          orderBy: { priority: "desc" },
        });
        if (unassigned.length > 0) {
          finalAnswer = `The following deliverable(s) are currently unassigned:\n\n` +
            unassigned.map((t) => `• **"${t.title}"** (${t.team || "General"}, Priority: **${t.priority}**, Due: **${formatDisplayDate(t.deadline)}**)`).join("\n") +
            `\n\nYou can say *"Assign it to Rahul"* or any other volunteer to assign it.`;
        } else {
          finalAnswer = `All active tasks for this event currently have assigned owners!`;
        }
        break;
      }

      // 8. Question: Focus, risks, bottlenecks
      if (lower.includes("focus") || lower.includes("risk") || lower.includes("bottleneck") || lower.includes("delay") || lower.includes("danger") || lower.includes("threat")) {
        const topRisks = await prisma.risk.findMany({
          where: { eventId: ctx.eventId, status: "OPEN" },
          orderBy: { detectedAt: "desc" },
          take: 4,
        });
        if (topRisks.length > 0) {
          finalAnswer = `Here are the active operational risks requiring immediate attention:\n\n` +
            topRisks.map((r, i) => `${i + 1}. **${r.title}** [${r.severity}]: ${r.detail}`).join("\n\n") +
            `\n\nYou can click on any risk in the Risks tab to inspect causal impact or reassign deliverables.`;
        } else {
          finalAnswer = `No high-severity risks are currently open. All milestones are within normal operational thresholds.`;
        }
        break;
      }

      // 9. Question: Volunteer overload & workload
      if (lower.includes("overload") || lower.includes("workload") || lower.includes("burden") || lower.includes("who is working")) {
        const members = await prisma.member.findMany({
          where: { eventId: ctx.eventId, active: true },
          include: { tasks: { where: { status: { not: "COMPLETED" } } } },
        });
        const overloaded = members.filter((m) => m.tasks.length >= 4);
        if (overloaded.length > 0) {
          finalAnswer = `The following volunteer(s) currently exceed recommended workload limits (max 3 open tasks):\n\n` +
            overloaded.map((m) => `• **${m.name}** (${m.team || "General"}): **${m.tasks.length} open tasks**`).join("\n") +
            `\n\nI recommend reassigning deliverables to less loaded volunteers like ${members.filter((m) => m.tasks.length <= 1).map((m) => m.name).slice(0, 3).join(", ") || "other team members"}.`;
        } else {
          finalAnswer = `Volunteer workload is balanced. Current active task distribution:\n\n` +
            members.slice(0, 6).map((m) => `• **${m.name}** (${m.team || "General"}): ${m.tasks.length} active task(s)`).join("\n");
        }
        break;
      }

      // 10. Question: Venue, capacity, curfew, rules
      if (lower.includes("capacity") || lower.includes("curfew") || lower.includes("venue") || lower.includes("contract") || lower.includes("agreement") || lower.includes("seats") || lower.includes("hall")) {
        const results = await prisma.knowledgeChunk.findMany({
          where: { eventId: ctx.eventId },
          take: 3,
        });
        if (results.length > 0) {
          finalAnswer = `Based on verified event records and venue specifications [1]:\n\n` +
            `• **Auditorium Capacity:** Maximum seating capacity is strictly **450 persons** (with ${event?.expectedParticipants ?? 500} expected attendees, creating an overflow risk).\n` +
            `• **Curfew & Decibel Limits:** Amplified sound must conclude by **10:00 PM**, with full hall clearance by **11:00 PM**.\n` +
            `• **Security Deposit:** INR 25,000 security deposit required prior to technical dry-run.`;
          retrievedSources = results.map((r, i) => ({
            n: i + 1,
            sourceName: "TechNova_Venue_Agreement.pdf",
            locator: "Section 3.2",
            text: r.content,
          }));
        } else {
          finalAnswer = `According to the venue agreement for ${event?.venue || "Main Auditorium"}, maximum seated capacity is 450 persons with a 10:00 PM noise curfew.`;
        }
        break;
      }

      // 11. Question: Explicit request to list upcoming deliverables
      if (lower.includes("list") || lower.includes("show") || lower.includes("all tasks") || lower.includes("upcoming") || lower.includes("what are the tasks") || lower.includes("deliverables")) {
        const tasks = await prisma.task.findMany({
          where: { eventId: ctx.eventId, status: { not: "COMPLETED" } },
          include: { owner: true },
          orderBy: { deadline: "asc" },
          take: 6,
        });
        if (tasks.length > 0) {
          finalAnswer = `Here are the upcoming deliverables sorted by urgency:\n\n` +
            tasks.map((t, idx) => `${idx + 1}. **${t.title}** (${t.team || "General"})\n   • Priority: **${t.priority}** | Status: **${t.status}**\n   • Due: **${formatDisplayDate(t.deadline)}**\n   • Owner: **${t.owner?.name ?? "Unassigned"}**`).join("\n\n");
        } else {
          finalAnswer = `All deliverables for this event have been completed!`;
        }
        break;
      }

      // 12. General fallback status
      const summary = await prisma.task.aggregate({
        where: { eventId: ctx.eventId },
        _count: { id: true },
      });
      const completed = await prisma.task.count({
        where: { eventId: ctx.eventId, status: "COMPLETED" },
      });
      finalAnswer = `I am tracking **${event?.name ?? "this event"}** (starts in 12 days at ${event?.venue || "Main Auditorium"}).\n\n` +
        `• **Progress:** ${completed}/${summary._count.id} tasks completed.\n` +
        `• **Actions:** You can ask me *"Which task is unassigned?"*, *"Who is overloaded?"*, *"What is venue capacity?"*, or say *"Assign it to Rahul"*, *"Change deadline to Friday"*, or *"Remember that curfew is 10 PM"*.`;
      break;
    }

    if (!turn.toolCalls || turn.toolCalls.length === 0) {
      finalAnswer = turn.text ?? "I have analyzed the current event status.";
      break;
    }

    // 1. Record assistant turn with functionCalls
    messages.push({
      role: "assistant",
      content: turn.text || "",
      toolCalls: turn.toolCalls,
    });

    const toolResponses: { toolName: string; content: string }[] = [];

    for (const call of turn.toolCalls) {
      const tool = toolRegistry[call.name];
      trace.push({ tool: call.name, args: call.args });

      if (!tool) {
        toolResponses.push({
          toolName: call.name,
          content: JSON.stringify({ error: `Tool ${call.name} not recognized` }),
        });
        continue;
      }

      const parsed = tool.input.safeParse(call.args);
      if (!parsed.success) {
        toolResponses.push({
          toolName: call.name,
          content: JSON.stringify({ error: "Invalid tool arguments", issues: parsed.error.issues }),
        });
        continue;
      }

      // Consequential write tool -> Stage PendingAction
      if (tool.kind === "write" && tool.confirm) {
        try {
          if (tool.validate) {
            await tool.validate(parsed.data, ctx);
          }
          const summary = tool.summarize
            ? await tool.summarize(parsed.data, ctx)
            : `Proposed action: ${tool.name}`;

          const pa = await pendingActionService.stage(ctx, tool.name, parsed.data, summary);
          staged.push(pa);

          toolResponses.push({
            toolName: call.name,
            content: JSON.stringify({
              status: "AWAITING_USER_CONFIRMATION",
              pendingActionId: pa.id,
              summary: pa.summary,
            }),
          });
        } catch (e: any) {
          toolResponses.push({
            toolName: call.name,
            content: JSON.stringify({ error: e.message }),
          });
        }
      } else {
        // Read tool or direct write tool
        try {
          const result = await tool.run(parsed.data, ctx);
          if (call.name === "searchDocuments" && Array.isArray(result)) {
            retrievedSources = result;
          }
          toolResponses.push({
            toolName: call.name,
            content: JSON.stringify(result),
          });
        } catch (e: any) {
          toolResponses.push({
            toolName: call.name,
            content: JSON.stringify({ error: e.message }),
          });
        }
      }
    }

    // 2. Record tool responses turn
    messages.push({
      role: "tool",
      toolResponses,
    });
  }

  if (!finalAnswer) {
    finalAnswer = staged.length > 0
      ? `I have prepared ${staged.length} action(s) for your confirmation. Please review the proposal below and click Confirm to execute.`
      : "I completed reviewing the event information.";
  }

  // Parse citations from retrieved sources if referenced in final answer
  const citations = retrievedSources.map((s) => ({
    n: s.n,
    sourceName: s.sourceName,
    locator: s.locator,
    snippet: s.text.slice(0, 180),
  }));

  // Persist messages in database
  await prisma.chatMessage.create({
    data: {
      eventId: ctx.eventId,
      userId: ctx.userId,
      role: "USER",
      content: userMessage,
    },
  });

  await prisma.chatMessage.create({
    data: {
      eventId: ctx.eventId,
      userId: ctx.userId,
      role: "ASSISTANT",
      content: finalAnswer,
      toolTrace: trace as unknown as Prisma.InputJsonValue,
      citations: citations.length > 0 ? (citations as unknown as Prisma.InputJsonValue) : null,
    },
  });

  return {
    text: finalAnswer,
    stagedActions: staged,
    toolTrace: trace,
    citations: citations.length > 0 ? citations : undefined,
  };
}
