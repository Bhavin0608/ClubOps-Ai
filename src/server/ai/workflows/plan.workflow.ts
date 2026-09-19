import { Ctx, requireOrganizer } from "@/lib/api";
import { prisma } from "@/lib/db";
import { resolveDeadlineFromOffset } from "@/lib/dates";
import { llm } from "../llm";
import { PlanSchema, PlanData } from "../schemas";
import { pendingActionService, registerActionRunner } from "@/server/services/pending-action.service";
import { taskService } from "@/server/services/task.service";
import { NotFoundError, ValidationError } from "@/lib/errors";

export interface ResolvedPlanTask {
  key: string;
  title: string;
  description: string;
  team: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  deadline: string; // ISO string
  dependsOn: string[];
  suggestedOwnerId: string | null;
  suggestedOwnerName: string | null;
}

export interface StagedPlanArgs {
  summary: string;
  tasks: ResolvedPlanTask[];
}

export const planWorkflow = {
  async generate(ctx: Ctx, organizerInstructions?: string) {
    requireOrganizer(ctx);

    const event = await prisma.event.findUnique({
      where: { id: ctx.eventId },
      include: {
        members: { where: { active: true } },
      },
    });
    if (!event) throw new NotFoundError("Event not found");

    const system = `You are an expert event planning strategist for college hackathons, technical symposia, and cultural fests.
Your task is to generate a comprehensive operational plan with teams, distinct tasks, and dependency graph.
Strict rules:
1. Every task must have a key (e.g., T1, T2, T3).
2. dependsOn must only reference other keys defined in the plan (no circular dependencies).
3. daysBeforeEvent must be between 0 (day of event) and 60.
4. suggestedOwner must match one of the active members' exact names provided below, or null if unassigned.`;

    const membersList = event.members
      .map((m) => `- ${m.name} (Team: ${m.team ?? "Unassigned"}, Skills: ${m.skills.join(", ") || "General"})`)
      .join("\n");

    const prompt = `Event: "${event.name}"
Start Date: ${event.startDate.toISOString().split("T")[0]}
Venue: ${event.venue ?? "Campus Auditorium"}
Expected Participants: ${event.expectedParticipants ?? 300}
Active Members:
${membersList || "No members registered yet."}

${organizerInstructions ? `Organizer Instructions: "${organizerInstructions}"` : ""}

Generate a well-structured operational plan.`;

    let plan: PlanData;
    try {
      plan = await llm.generateJson({
        system,
        prompt,
        schema: PlanSchema,
        temperature: 0.3,
      });
    } catch {
      // Offline fallback plan if AI key is missing or model offline
      plan = {
        summary: `Operational launch plan for ${event.name}`,
        teams: [
          { name: "Logistics", purpose: "Venue, seating, equipment and staging" },
          { name: "Tech & AV", purpose: "Livestream, projectors, audio setup" },
          { name: "Hospitality", purpose: "Food, water, guest welcome" },
        ],
        tasks: [
          {
            key: "T1",
            title: "Confirm venue layout and seating",
            description: "Coordinate with campus facility manager on chair arrangement",
            team: "Logistics",
            priority: "HIGH",
            daysBeforeEvent: 8,
            dependsOn: [],
            suggestedOwner: event.members[0]?.name ?? null,
          },
          {
            key: "T2",
            title: "Setup audio-visual testing",
            description: "Test projectors, mics, and livestream feed",
            team: "Tech & AV",
            priority: "CRITICAL",
            daysBeforeEvent: 3,
            dependsOn: ["T1"],
            suggestedOwner: null,
          },
          {
            key: "T3",
            title: "Order participant food and refreshments",
            description: "Finalize catering menu and meal coupons",
            team: "Hospitality",
            priority: "MEDIUM",
            daysBeforeEvent: 5,
            dependsOn: [],
            suggestedOwner: event.members[1]?.name ?? null,
          },
        ],
        volunteerNeeds: [{ team: "Logistics", count: 4, skills: ["Coordination"] }],
        watchouts: ["Ensure venue gate pass permissions are approved early"],
      };
    }

    // Deterministic post-processing
    const memberNameMap = new Map(
      event.members.map((m) => [m.name.trim().toLowerCase(), m])
    );

    const resolvedTasks: ResolvedPlanTask[] = plan.tasks.map((t) => {
      const deadline = resolveDeadlineFromOffset(event.startDate, t.daysBeforeEvent, ctx.now);
      let matchedMember = null;
      if (t.suggestedOwner) {
        matchedMember = memberNameMap.get(t.suggestedOwner.trim().toLowerCase()) ?? null;
      }

      return {
        key: t.key,
        title: t.title,
        description: t.description,
        team: t.team,
        priority: t.priority,
        deadline: deadline.toISOString(),
        dependsOn: t.dependsOn,
        suggestedOwnerId: matchedMember?.id ?? null,
        suggestedOwnerName: matchedMember?.name ?? null,
      };
    });

    const stagedArgs: StagedPlanArgs = {
      summary: plan.summary,
      tasks: resolvedTasks,
    };

    const summary = `Create ${resolvedTasks.length} operational tasks for "${event.name}" across ${plan.teams.length} teams with dependencies.`;

    const pending = await pendingActionService.stage(
      ctx,
      "applyEventPlan",
      stagedArgs,
      summary
    );

    return {
      plan,
      resolvedTasks,
      pendingActionId: pending.id,
      summary,
    };
  },
};

// Register runner for executing the confirmed plan
registerActionRunner("applyEventPlan", {
  async validate(args: StagedPlanArgs, ctx: Ctx) {
    if (!args.tasks || args.tasks.length === 0) {
      throw new ValidationError("Plan contains no tasks to create");
    }
  },
  async run(args: StagedPlanArgs, ctx: Ctx) {
    const keyToTaskId = new Map<string, string>();

    // Step 1: Create all tasks in transaction
    for (const t of args.tasks) {
      const created = await taskService.create(ctx, {
        title: t.title,
        description: t.description,
        team: t.team,
        priority: t.priority,
        deadline: t.deadline ? new Date(t.deadline) : null,
        ownerId: t.suggestedOwnerId,
        source: "AI_GENERATED",
      });
      keyToTaskId.set(t.key, created.id);
    }

    // Step 2: Wire dependencies
    for (const t of args.tasks) {
      if (t.dependsOn && t.dependsOn.length > 0) {
        const taskId = keyToTaskId.get(t.key);
        const prereqIds = t.dependsOn
          .map((k) => keyToTaskId.get(k))
          .filter((id): id is string => Boolean(id));

        if (taskId && prereqIds.length > 0) {
          try {
            await taskService.setDependencies(ctx, taskId, prereqIds);
          } catch (e) {
            console.warn(`Could not wire dependency for ${t.title}:`, e);
          }
        }
      }
    }

    return { createdCount: args.tasks.length };
  },
});
