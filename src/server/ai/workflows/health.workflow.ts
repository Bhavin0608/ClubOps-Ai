import { Ctx, requireOrganizer } from "@/lib/api";
import { prisma } from "@/lib/db";
import { llm } from "../llm";
import { HealthSummarySchema, HealthSummaryData } from "../schemas";
import { computeEventHealth } from "../../risk/detect";

export const healthWorkflow = {
  async generate(ctx: Ctx): Promise<{
    status: "CRITICAL" | "AT_RISK" | "ON_TRACK";
    summary: HealthSummaryData;
  }> {
    requireOrganizer(ctx);

    const openRisks = await prisma.risk.findMany({
      where: { eventId: ctx.eventId, status: "OPEN" },
      orderBy: [{ severity: "desc" }],
    });

    const tasks = await prisma.task.findMany({
      where: { eventId: ctx.eventId },
      select: { id: true, title: true, status: true, priority: true, deadline: true },
    });

    const status = computeEventHealth(openRisks);

    const system = `You are an event command center health analyst.
Synthesize the event's current operational state using the provided tasks and open risks.
Output a concise operational headline and up to 4 focus priorities.
Only reference task IDs present in the input list.`;

    const prompt = `Status: ${status}
Open Risks (${openRisks.length}):
${openRisks.map((r) => `- [${r.severity}] ${r.title}: ${r.detail}`).join("\n") || "No open risks"}

Active Tasks:
${tasks.map((t) => `- [ID: ${t.id}] ${t.title} (Status: ${t.status}, Priority: ${t.priority})`).slice(0, 20).join("\n")}`;

    let summary: HealthSummaryData;
    try {
      summary = await llm.generateJson({
        system,
        prompt,
        schema: HealthSummarySchema,
        temperature: 0.2,
      });

      // Server post-validation: drop taskIds that do not exist
      const validTaskIds = new Set(tasks.map((t) => t.id));
      summary.focus = summary.focus.map((f) => ({
        ...f,
        taskIds: f.taskIds.filter((id) => validTaskIds.has(id)),
      }));
    } catch {
      summary = {
        headline:
          status === "CRITICAL"
            ? "Critical bottlenecks require urgent organizer intervention before downstream setup"
            : status === "AT_RISK"
            ? "Operational risks detected; review pending deadlines and volunteer workload"
            : "Event operations are on track with normal milestone progression",
        focus: openRisks.slice(0, 3).map((r) => ({
          title: r.title,
          why: r.detail,
          suggestedAction: "Resolve bottleneck and coordinate with assigned team",
          taskIds: r.entityType === "TASK" && r.entityId ? [r.entityId] : [],
        })),
      };
    }

    return {
      status,
      summary,
    };
  },
};
