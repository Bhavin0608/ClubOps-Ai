import { z } from "zod";
import { Ctx } from "@/lib/api";
import { prisma } from "@/lib/db";
import { taskService } from "@/server/services/task.service";
import { memberService } from "@/server/services/member.service";
import { memoryService } from "@/server/services/memory.service";
import { riskService } from "@/server/services/risk.service";
import { dashboardService } from "@/server/services/dashboard.service";
import { meetingService } from "@/server/services/meeting.service";
import { retrieve } from "../rag/retrieve";
import { announcementWorkflow } from "../workflows/announcement.workflow";
import { planWorkflow } from "../workflows/plan.workflow";
import { registerActionRunner } from "@/server/services/pending-action.service";
import { formatDisplayDate } from "@/lib/dates";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { addDays } from "date-fns";

export interface AiTool<I extends z.ZodTypeAny = z.ZodTypeAny> {
  name: string;
  description: string;
  input: I;
  kind: "read" | "write";
  confirm: boolean;
  validate?: (args: z.infer<I>, ctx: Ctx) => Promise<void>;
  summarize?: (args: z.infer<I>, ctx: Ctx) => Promise<string>;
  run: (args: z.infer<I>, ctx: Ctx) => Promise<unknown>;
}

// Smart fuzzy resolution helpers
export async function resolveTaskId(ctx: Ctx, identifier: string): Promise<string> {
  const trimmed = identifier.trim();

  // 1. Direct ID match (only if valid 24-char hex ObjectId)
  if (/^[0-9a-fA-F]{24}$/.test(trimmed)) {
    const direct = await prisma.task.findFirst({
      where: { id: trimmed, eventId: ctx.eventId },
    });
    if (direct) return direct.id;
  }

  // 2. In-memory matching over event tasks (safe from MongoDB driver errors)
  const allTasks = await prisma.task.findMany({
    where: { eventId: ctx.eventId },
    select: { id: true, title: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  const normalized = trimmed.toLowerCase();

  // Exact match
  const exact = allTasks.find((t) => t.title.toLowerCase() === normalized);
  if (exact) return exact.id;

  // Substring match
  const sub = allTasks.find((t) => t.title.toLowerCase().includes(normalized));
  if (sub) return sub.id;

  // Multi-word match
  const words = normalized.split(/\s+/).filter((w) => w.length > 2);
  if (words.length > 0) {
    const wordMatch = allTasks.find((t) => {
      const lt = t.title.toLowerCase();
      return words.every((w) => lt.includes(w));
    });
    if (wordMatch) return wordMatch.id;
  }

  // 3. "Task 1", "Task 2", etc.
  const matchNum = trimmed.match(/\b(\d+)\b/);
  if (matchNum) {
    const idx = parseInt(matchNum[1], 10) - 1;
    if (idx >= 0 && idx < allTasks.length) {
      return allTasks[idx].id;
    }
  }

  throw new NotFoundError(`Could not find task matching "${identifier}"`);
}

export async function resolveMemberId(ctx: Ctx, identifier: string | null | undefined): Promise<string | null> {
  if (!identifier || identifier.toLowerCase() === "unassigned" || identifier.toLowerCase() === "none") {
    return null;
  }
  const trimmed = identifier.trim();

  // 1. Direct ID match (only if valid 24-char hex ObjectId)
  if (/^[0-9a-fA-F]{24}$/.test(trimmed)) {
    const direct = await prisma.member.findFirst({
      where: { id: trimmed, eventId: ctx.eventId },
    });
    if (direct) return direct.id;
  }

  // 2. In-memory matching over active event members
  const members = await prisma.member.findMany({
    where: { eventId: ctx.eventId, active: true },
  });

  const normalized = trimmed.toLowerCase();

  // Exact match
  const exact = members.find((m) => m.name.toLowerCase() === normalized);
  if (exact) return exact.id;

  // First name match
  const firstName = members.find((m) => m.name.toLowerCase().split(" ")[0] === normalized.split(" ")[0]);
  if (firstName) return firstName.id;

  // Substring match
  const sub = members.find((m) => m.name.toLowerCase().includes(normalized));
  if (sub) return sub.id;

  throw new NotFoundError(`Could not find volunteer matching "${identifier}"`);
}

export function parseDeadline(input: string, baseDate = new Date()): Date {
  const lower = input.toLowerCase().trim();
  if (lower === "today") return baseDate;
  if (lower === "tomorrow") return addDays(baseDate, 1);
  if (lower.startsWith("in ") && lower.endsWith(" days")) {
    const d = parseInt(lower.replace("in ", "").replace(" days", ""), 10);
    if (!isNaN(d)) return addDays(baseDate, d);
  }
  const parsed = new Date(input);
  if (!isNaN(parsed.getTime())) return parsed;
  return addDays(baseDate, 3);
}

export const toolRegistry: Record<string, AiTool<any>> = {
  // 1. getEventSummary
  getEventSummary: {
    name: "getEventSummary",
    description: "Returns overall event statistics, progress metrics, countdown days, and open risk counts.",
    input: z.object({}),
    kind: "read",
    confirm: false,
    async run(_args, ctx) {
      return dashboardService.metrics(ctx);
    },
  },

  // 2. listTasks
  listTasks: {
    name: "listTasks",
    description: "Search and filter tasks for the event by status, owner, team, priority, or search query.",
    input: z.object({
      status: z.enum(["TODO", "IN_PROGRESS", "BLOCKED", "COMPLETED"]).optional(),
      ownerId: z.string().optional(),
      team: z.string().optional(),
      overdueOnly: z.boolean().optional(),
      query: z.string().optional(),
    }),
    kind: "read",
    confirm: false,
    async run(args, ctx) {
      const tasks = await taskService.list(ctx, {
        status: args.status,
        ownerId: args.ownerId,
        team: args.team,
        overdueOnly: args.overdueOnly,
        search: args.query,
      });
      return tasks.map((t) => ({
        id: t.id,
        title: t.title,
        status: t.status,
        priority: t.priority,
        team: t.team,
        deadline: t.deadline?.toISOString().split("T")[0] ?? null,
        owner: t.owner ? { id: t.owner.id, name: t.owner.name } : null,
      }));
    },
  },

  // 3. listMembers
  listMembers: {
    name: "listMembers",
    description: "List active club members and volunteers with their teams, skills, and current open workload.",
    input: z.object({}),
    kind: "read",
    confirm: false,
    async run(_args, ctx) {
      return memberService.list(ctx);
    },
  },

  // 4. listRisks
  listRisks: {
    name: "listRisks",
    description: "List currently detected operational risks and bottlenecks for the event.",
    input: z.object({}),
    kind: "read",
    confirm: false,
    async run(_args, ctx) {
      const risks = await riskService.list(ctx);
      return risks.map((r) => ({
        id: r.id,
        severity: r.severity,
        title: r.title,
        detail: r.detail,
        evidence: r.evidence,
      }));
    },
  },

  // 5. getMeetingSummary
  getMeetingSummary: {
    name: "getMeetingSummary",
    description: "Fetch meeting summary, decisions, and action items. Defaults to latest meeting if omitted.",
    input: z.object({
      meetingId: z.string().optional(),
    }),
    kind: "read",
    confirm: false,
    async run(args, ctx) {
      if (args.meetingId) {
        return meetingService.get(ctx, args.meetingId);
      }
      const meetings = await meetingService.list(ctx);
      if (meetings.length === 0) return { message: "No meetings found" };
      return meetingService.get(ctx, meetings[0].id);
    },
  },

  // 6. searchDocuments
  searchDocuments: {
    name: "searchDocuments",
    description: "Search uploaded event documents, contracts, agreements, and meeting transcripts using semantic RAG retrieval.",
    input: z.object({
      query: z.string().describe("Specific query or question to search in event documents"),
    }),
    kind: "read",
    confirm: false,
    async run(args, ctx) {
      return retrieve(ctx, args.query);
    },
  },

  // 7. listLearnedMemories (Continuous Learning)
  listLearnedMemories: {
    name: "listLearnedMemories",
    description: "Retrieve all learned operational rules, user preferences, corrections, and instructions stored for this event.",
    input: z.object({}),
    kind: "read",
    confirm: false,
    async run(_args, ctx) {
      return memoryService.list(ctx);
    },
  },

  // 8. saveLearnedMemory (Continuous Learning)
  saveLearnedMemory: {
    name: "saveLearnedMemory",
    description: "Save or update a learned operational rule, user preference, or correction so the AI adheres to it in all future queries.",
    input: z.object({
      key: z.string().describe("Short unique topic key, e.g. 'Logistics-Lead', 'Venue-Curfew'"),
      instruction: z.string().describe("Exact operational rule or user preference to remember"),
      category: z.enum(["PREFERENCE", "CORRECTION", "RULE", "FEEDBACK"]).optional(),
    }),
    kind: "write",
    confirm: false,
    async run(args, ctx) {
      return memoryService.save(ctx, {
        key: args.key,
        instruction: args.instruction,
        category: args.category ?? "PREFERENCE",
      });
    },
  },

  // 9. assignTask (CRUD: Assign/Reassign - Consequential)
  assignTask: {
    name: "assignTask",
    description: "Assign or reassign a task to a volunteer. Accepts task title/ID and volunteer name/ID.",
    input: z.object({
      task: z.string().describe("Task title, partial title, or task ID"),
      assignee: z.string().nullable().describe("Volunteer name, member ID, or 'unassigned'"),
    }),
    kind: "write",
    confirm: true,
    async validate(args, ctx) {
      const taskId = await resolveTaskId(ctx, args.task);
      const memberId = await resolveMemberId(ctx, args.assignee);
      await taskService.get(ctx, taskId);
      if (memberId) {
        await memberService.get(ctx, memberId);
      }
    },
    async summarize(args, ctx) {
      const taskId = await resolveTaskId(ctx, args.task);
      const memberId = await resolveMemberId(ctx, args.assignee);
      const task = await taskService.get(ctx, taskId);
      let targetName = "Unassigned";
      if (memberId) {
        const member = await memberService.get(ctx, memberId);
        targetName = member.name;
      }
      const currentOwner = task.owner?.name ?? "Unassigned";
      return `Reassign "${task.title}": ${currentOwner} → ${targetName}`;
    },
    async run(args, ctx) {
      const taskId = await resolveTaskId(ctx, args.task);
      const memberId = await resolveMemberId(ctx, args.assignee);
      return taskService.assign(ctx, taskId, memberId);
    },
  },

  // 10. changeTaskDeadline (CRUD: Update Deadline - Consequential)
  changeTaskDeadline: {
    name: "changeTaskDeadline",
    description: "Change the deadline of a task. Accepts task title/ID and date string ('2026-10-05', 'tomorrow', 'Friday').",
    input: z.object({
      task: z.string().describe("Task title, partial title, or task ID"),
      deadline: z.string().describe("New deadline date string or relative date"),
    }),
    kind: "write",
    confirm: true,
    async validate(args, ctx) {
      const taskId = await resolveTaskId(ctx, args.task);
      await taskService.get(ctx, taskId);
    },
    async summarize(args, ctx) {
      const taskId = await resolveTaskId(ctx, args.task);
      const task = await taskService.get(ctx, taskId);
      const date = parseDeadline(args.deadline, ctx.now);
      const oldDeadline = formatDisplayDate(task.deadline);
      const newDeadline = formatDisplayDate(date);
      return `Change deadline of "${task.title}": ${oldDeadline} → ${newDeadline}`;
    },
    async run(args, ctx) {
      const taskId = await resolveTaskId(ctx, args.task);
      const date = parseDeadline(args.deadline, ctx.now);
      return taskService.changeDeadline(ctx, taskId, date);
    },
  },

  // 11. updateTaskStatus (CRUD: Update Status - Direct)
  updateTaskStatus: {
    name: "updateTaskStatus",
    description: "Update the progress status of a task (TODO, IN_PROGRESS, BLOCKED, COMPLETED).",
    input: z.object({
      task: z.string().describe("Task title, partial title, or task ID"),
      status: z.enum(["TODO", "IN_PROGRESS", "BLOCKED", "COMPLETED"]),
    }),
    kind: "write",
    confirm: false,
    async run(args, ctx) {
      const taskId = await resolveTaskId(ctx, args.task);
      return taskService.updateStatus(ctx, taskId, args.status);
    },
  },

  // 12. updateTask (CRUD: Full Update - Consequential)
  updateTask: {
    name: "updateTask",
    description: "Update title, description, team, or priority of a task.",
    input: z.object({
      task: z.string().describe("Task title, partial title, or task ID"),
      title: z.string().optional(),
      description: z.string().optional(),
      priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
      team: z.string().optional(),
    }),
    kind: "write",
    confirm: true,
    async validate(args, ctx) {
      const taskId = await resolveTaskId(ctx, args.task);
      await taskService.get(ctx, taskId);
    },
    async summarize(args, ctx) {
      const taskId = await resolveTaskId(ctx, args.task);
      const task = await taskService.get(ctx, taskId);
      const changes: string[] = [];
      if (args.title) changes.push(`Title: "${args.title}"`);
      if (args.priority) changes.push(`Priority: ${args.priority}`);
      if (args.team) changes.push(`Team: ${args.team}`);
      return `Update task "${task.title}": ${changes.join(", ")}`;
    },
    async run(args, ctx) {
      const taskId = await resolveTaskId(ctx, args.task);
      return taskService.update(ctx, taskId, {
        title: args.title,
        description: args.description,
        priority: args.priority,
        team: args.team,
      });
    },
  },

  // 13. deleteTask (CRUD: Delete - Consequential)
  deleteTask: {
    name: "deleteTask",
    description: "Delete a task from the event. Requires user confirmation.",
    input: z.object({
      task: z.string().describe("Task title, partial title, or task ID to delete"),
    }),
    kind: "write",
    confirm: true,
    async validate(args, ctx) {
      const taskId = await resolveTaskId(ctx, args.task);
      await taskService.get(ctx, taskId);
    },
    async summarize(args, ctx) {
      const taskId = await resolveTaskId(ctx, args.task);
      const task = await taskService.get(ctx, taskId);
      return `Delete task "${task.title}" (${task.team || "General"})`;
    },
    async run(args, ctx) {
      const taskId = await resolveTaskId(ctx, args.task);
      return taskService.delete(ctx, taskId);
    },
  },

  // 14. createTask (CRUD: Create Single Task - Consequential)
  createTask: {
    name: "createTask",
    description: "Create a new task with title, team, priority, deadline, and optional volunteer assignee.",
    input: z.object({
      title: z.string().describe("Task title"),
      description: z.string().optional(),
      team: z.string().optional().describe("Team name (e.g. Logistics, Tech, Marketing)"),
      priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
      deadline: z.string().optional().describe("Deadline date string or relative date"),
      assignee: z.string().optional().describe("Volunteer name or member ID to assign to"),
    }),
    kind: "write",
    confirm: true,
    async validate(args, ctx) {
      if (!args.title || args.title.trim().length === 0) {
        throw new ValidationError("Task title is required");
      }
      if (args.assignee) {
        await resolveMemberId(ctx, args.assignee);
      }
    },
    async summarize(args, ctx) {
      let assigneeName = "Unassigned";
      if (args.assignee) {
        const memberId = await resolveMemberId(ctx, args.assignee);
        if (memberId) {
          const m = await memberService.get(ctx, memberId);
          assigneeName = m.name;
        }
      }
      return `Create task "${args.title}" (${args.team || "General"}, Priority: ${args.priority || "MEDIUM"}, Assigned to: ${assigneeName})`;
    },
    async run(args, ctx) {
      let ownerId: string | null = null;
      if (args.assignee) {
        ownerId = await resolveMemberId(ctx, args.assignee);
      }
      const deadlineDate = args.deadline ? parseDeadline(args.deadline, ctx.now) : null;
      return taskService.create(ctx, {
        title: args.title,
        description: args.description,
        team: args.team,
        priority: args.priority ?? "MEDIUM",
        deadline: deadlineDate,
        ownerId,
        source: "AI_GENERATED",
      });
    },
  },

  // 15. addVolunteer (CRUD: Create Member - Consequential)
  addVolunteer: {
    name: "addVolunteer",
    description: "Add a new volunteer to the event roster.",
    input: z.object({
      name: z.string().describe("Volunteer's full name"),
      team: z.string().optional().describe("Assigned team"),
      role: z.enum(["ORGANIZER", "VOLUNTEER"]).optional(),
      skills: z.array(z.string()).optional().describe("List of skills"),
      email: z.string().optional(),
    }),
    kind: "write",
    confirm: true,
    async validate(args) {
      if (!args.name || args.name.trim().length === 0) {
        throw new ValidationError("Volunteer name is required");
      }
    },
    async summarize(args) {
      return `Add volunteer ${args.name} to ${args.team || "General"} team (Role: ${args.role || "VOLUNTEER"})`;
    },
    async run(args, ctx) {
      return memberService.create(ctx, {
        name: args.name,
        team: args.team,
        role: args.role ?? "VOLUNTEER",
        skills: args.skills ?? [],
        email: args.email,
      });
    },
  },

  // 16. removeVolunteer (CRUD: Delete Member - Consequential)
  removeVolunteer: {
    name: "removeVolunteer",
    description: "Remove or deactivate a volunteer from the event roster.",
    input: z.object({
      member: z.string().describe("Volunteer name or member ID to remove"),
    }),
    kind: "write",
    confirm: true,
    async validate(args, ctx) {
      const memberId = await resolveMemberId(ctx, args.member);
      if (!memberId) throw new NotFoundError("Member not found");
    },
    async summarize(args, ctx) {
      const memberId = await resolveMemberId(ctx, args.member);
      const member = await memberService.get(ctx, memberId!);
      return `Remove volunteer "${member.name}" (${member.team || "General"}) from the event roster`;
    },
    async run(args, ctx) {
      const memberId = await resolveMemberId(ctx, args.member);
      return memberService.delete(ctx, memberId!);
    },
  },

  // 17. draftAnnouncement
  draftAnnouncement: {
    name: "draftAnnouncement",
    description: "Draft an event announcement saved as an inert DRAFT for review and publication.",
    input: z.object({
      purpose: z.string(),
      audience: z.enum(["VOLUNTEERS", "PARTICIPANTS", "ALL"]).optional(),
      tone: z.enum(["urgent", "enthusiastic", "informative", "reminder"]).optional(),
    }),
    kind: "write",
    confirm: false,
    async run(args, ctx) {
      return announcementWorkflow.draft(ctx, args);
    },
  },

  // 18. proposeEventPlan
  proposeEventPlan: {
    name: "proposeEventPlan",
    description: "Propose an end-to-end strategic event plan with teams, deliverables, and dependencies.",
    input: z.object({
      instructions: z.string().optional(),
    }),
    kind: "write",
    confirm: false,
    async run(args, ctx) {
      return planWorkflow.generate(ctx, args.instructions);
    },
  },
};

// Register action runners for consequential tools
for (const [name, tool] of Object.entries(toolRegistry)) {
  if (tool.kind === "write" && tool.confirm) {
    registerActionRunner(name, {
      validate: tool.validate,
      run: tool.run,
    });
  }
}
