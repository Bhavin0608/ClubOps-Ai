import { z } from "zod";
import { Ctx } from "@/lib/api";
import { prisma } from "@/lib/db";
import { taskService } from "@/server/services/task.service";
import { memberService } from "@/server/services/member.service";
import { riskService } from "@/server/services/risk.service";
import { dashboardService } from "@/server/services/dashboard.service";
import { meetingService } from "@/server/services/meeting.service";
import { retrieve } from "../rag/retrieve";
import { announcementWorkflow } from "../workflows/announcement.workflow";
import { planWorkflow } from "../workflows/plan.workflow";
import { registerActionRunner } from "@/server/services/pending-action.service";
import { formatDisplayDate } from "@/lib/dates";
import { NotFoundError, ValidationError } from "@/lib/errors";

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

export const toolRegistry: Record<string, AiTool<any>> = {
  // 1. getEventSummary
  getEventSummary: {
    name: "getEventSummary",
    description: "Returns overall event statistics, progress metrics, days countdown, and risk counts.",
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
    description: "Search and filter tasks for the event. Always call this to find real task IDs before proposing updates.",
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
    description: "Fetch meeting summary, decisions, and action items. Defaults to the latest meeting if meetingId is omitted.",
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
    description: "Search uploaded event documents, contracts, agreements, and meeting transcripts using RAG semantic retrieval.",
    input: z.object({
      query: z.string().describe("The specific query to search in event documents"),
    }),
    kind: "read",
    confirm: false,
    async run(args, ctx) {
      return retrieve(ctx, args.query);
    },
  },

  // 7. updateTaskStatus
  updateTaskStatus: {
    name: "updateTaskStatus",
    description: "Update the progress status of a task (TODO, IN_PROGRESS, BLOCKED, COMPLETED). Audited directly.",
    input: z.object({
      taskId: z.string(),
      status: z.enum(["TODO", "IN_PROGRESS", "BLOCKED", "COMPLETED"]),
    }),
    kind: "write",
    confirm: false,
    async run(args, ctx) {
      return taskService.updateStatus(ctx, args.taskId, args.status);
    },
  },

  // 8. draftAnnouncement
  draftAnnouncement: {
    name: "draftAnnouncement",
    description: "Draft an event announcement. Saves as an inert DRAFT that an organizer can review and publish.",
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

  // 9. assignTask (Consequential -> confirm: true)
  assignTask: {
    name: "assignTask",
    description: "Assign a task to a volunteer. Requires user confirmation.",
    input: z.object({
      taskId: z.string(),
      ownerId: z.string().nullable(),
    }),
    kind: "write",
    confirm: true,
    async validate(args, ctx) {
      await taskService.get(ctx, args.taskId);
      if (args.ownerId) {
        await memberService.get(ctx, args.ownerId);
      }
    },
    async summarize(args, ctx) {
      const task = await taskService.get(ctx, args.taskId);
      let targetOwner = "Unassigned";
      if (args.ownerId) {
        const member = await memberService.get(ctx, args.ownerId);
        targetOwner = member.name;
      }
      const currentOwner = task.owner?.name ?? "Unassigned";
      return `Reassign "${task.title}": ${currentOwner} → ${targetOwner}`;
    },
    async run(args, ctx) {
      return taskService.assign(ctx, args.taskId, args.ownerId);
    },
  },

  // 10. changeTaskDeadline (Consequential -> confirm: true)
  changeTaskDeadline: {
    name: "changeTaskDeadline",
    description: "Change the deadline of a task. Requires user confirmation.",
    input: z.object({
      taskId: z.string(),
      deadlineISO: z.string().describe("New deadline in YYYY-MM-DD or ISO string format"),
    }),
    kind: "write",
    confirm: true,
    async validate(args, ctx) {
      await taskService.get(ctx, args.taskId);
      const date = new Date(args.deadlineISO);
      if (isNaN(date.getTime())) {
        throw new ValidationError("Invalid deadline date provided");
      }
    },
    async summarize(args, ctx) {
      const task = await taskService.get(ctx, args.taskId);
      const oldDeadline = formatDisplayDate(task.deadline);
      const newDeadline = formatDisplayDate(new Date(args.deadlineISO));
      return `Change deadline of "${task.title}": ${oldDeadline} → ${newDeadline}`;
    },
    async run(args, ctx) {
      return taskService.changeDeadline(ctx, args.taskId, new Date(args.deadlineISO));
    },
  },

  // 11. updateTask (Consequential -> confirm: true)
  updateTask: {
    name: "updateTask",
    description: "Update task title, description, team, or priority. Requires user confirmation.",
    input: z.object({
      taskId: z.string(),
      title: z.string().optional(),
      description: z.string().optional(),
      priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
      team: z.string().optional(),
    }),
    kind: "write",
    confirm: true,
    async validate(args, ctx) {
      await taskService.get(ctx, args.taskId);
    },
    async summarize(args, ctx) {
      const task = await taskService.get(ctx, args.taskId);
      const changes: string[] = [];
      if (args.title) changes.push(`Title: "${args.title}"`);
      if (args.priority) changes.push(`Priority: ${args.priority}`);
      if (args.team) changes.push(`Team: ${args.team}`);
      return `Update "${task.title}": ${changes.join(", ")}`;
    },
    async run(args, ctx) {
      return taskService.update(ctx, args.taskId, args);
    },
  },

  // 12. createTasks (Consequential -> confirm: true)
  createTasks: {
    name: "createTasks",
    description: "Create one or more new tasks. Requires user confirmation.",
    input: z.object({
      tasks: z.array(
        z.object({
          title: z.string(),
          description: z.string().optional(),
          priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
          team: z.string().optional(),
          deadlineISO: z.string().optional(),
          ownerId: z.string().optional(),
        })
      ),
    }),
    kind: "write",
    confirm: true,
    async validate(args, ctx) {
      if (!args.tasks || args.tasks.length === 0) {
        throw new ValidationError("Task list cannot be empty");
      }
    },
    async summarize(args) {
      return `Create ${args.tasks.length} new task(s): ${args.tasks.map((t: any) => `"${t.title}"`).join(", ")}`;
    },
    async run(args, ctx) {
      const inputs = args.tasks.map((t: any) => ({
        title: t.title,
        description: t.description,
        priority: t.priority ?? "MEDIUM",
        team: t.team,
        deadline: t.deadlineISO ? new Date(t.deadlineISO) : null,
        ownerId: t.ownerId ?? null,
        source: "AI_GENERATED" as const,
      }));
      return taskService.createMany(ctx, inputs);
    },
  },

  // 13. proposeEventPlan (Consequential -> confirm: true)
  proposeEventPlan: {
    name: "proposeEventPlan",
    description: "Propose an end-to-end event plan with teams, tasks, and dependencies. Stages a confirmation card.",
    input: z.object({
      instructions: z.string().optional(),
    }),
    kind: "write",
    confirm: false, // Internal staging handles confirmation
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
