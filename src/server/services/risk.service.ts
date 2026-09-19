import { prisma } from "@/lib/db";
import { Ctx, requireOrganizer } from "@/lib/api";
import { NotFoundError } from "@/lib/errors";
import { auditService } from "./audit.service";
import { detectRisks, computeEventHealth } from "../risk/detect";
import { EventSnapshot } from "../risk/types";
import { Prisma, RiskStatus } from "@prisma/client";

export const riskService = {
  async refresh(ctx: Ctx) {
    requireOrganizer(ctx);

    const event = await prisma.event.findUnique({
      where: { id: ctx.eventId },
      include: {
        tasks: {
          include: {
            prerequisites: { select: { prerequisiteId: true } },
          },
        },
        members: true,
      },
    });

    if (!event) throw new NotFoundError("Event not found");

    const snapshot: EventSnapshot = {
      id: event.id,
      name: event.name,
      startDate: event.startDate,
      expectedParticipants: event.expectedParticipants,
      tasks: event.tasks.map((t) => ({
        id: t.id,
        title: t.title,
        status: t.status,
        priority: t.priority,
        ownerId: t.ownerId,
        team: t.team,
        deadline: t.deadline,
        prerequisiteIds: t.prerequisites.map((p) => p.prerequisiteId),
      })),
      members: event.members.map((m) => ({
        id: m.id,
        name: m.name,
        team: m.team,
        role: m.role,
        active: m.active,
      })),
    };

    const detected = detectRisks(snapshot, ctx.now);
    const activeFingerprints = new Set(detected.map((d) => d.fingerprint));

    // Reconcile with existing database risks
    const existing = await prisma.risk.findMany({
      where: { eventId: ctx.eventId },
    });

    return prisma.$transaction(async (tx) => {
      // 1. Upsert detected risks
      for (const candidate of detected) {
        const match = existing.find((r) => r.fingerprint === candidate.fingerprint);

        if (!match) {
          await tx.risk.create({
            data: {
              eventId: ctx.eventId,
              fingerprint: candidate.fingerprint,
              ruleKey: candidate.ruleKey,
              severity: candidate.severity,
              status: "OPEN",
              title: candidate.title,
              detail: candidate.detail,
              entityType: candidate.entityType,
              entityId: candidate.entityId,
              evidence: candidate.evidence as Prisma.InputJsonValue,
              evidenceHash: candidate.evidenceHash,
            },
          });
        } else {
          // If already ACKNOWLEDGED, don't revert to OPEN; update evidence and title
          await tx.risk.update({
            where: { id: match.id },
            data: {
              severity: candidate.severity,
              title: candidate.title,
              detail: candidate.detail,
              evidence: candidate.evidence as Prisma.InputJsonValue,
              evidenceHash: candidate.evidenceHash,
              // If evidence changed, clear cached explanation to re-explain
              ...(match.evidenceHash !== candidate.evidenceHash
                ? { aiExplainedHash: null }
                : {}),
            },
          });
        }
      }

      // 2. Mark risks no longer detected as RESOLVED
      for (const ex of existing) {
        if (!activeFingerprints.has(ex.fingerprint) && ex.status !== "RESOLVED") {
          await tx.risk.update({
            where: { id: ex.id },
            data: {
              status: "RESOLVED",
              resolvedAt: new Date(),
            },
          });
        }
      }

      return tx.risk.findMany({
        where: { eventId: ctx.eventId, status: { not: "RESOLVED" } },
        orderBy: [{ severity: "desc" }, { detectedAt: "desc" }],
      });
    });
  },

  async list(ctx: Ctx, includeResolved = false) {
    requireOrganizer(ctx);
    return prisma.risk.findMany({
      where: {
        eventId: ctx.eventId,
        ...(includeResolved ? {} : { status: { not: "RESOLVED" } }),
      },
      orderBy: [{ severity: "desc" }, { detectedAt: "desc" }],
    });
  },

  async get(ctx: Ctx, riskId: string) {
    requireOrganizer(ctx);
    const risk = await prisma.risk.findFirst({
      where: { id: riskId, eventId: ctx.eventId },
    });
    if (!risk) throw new NotFoundError("Risk not found");
    return risk;
  },

  async setStatus(ctx: Ctx, riskId: string, status: RiskStatus) {
    requireOrganizer(ctx);
    const before = await this.get(ctx, riskId);

    const updated = await prisma.risk.update({
      where: { id: riskId },
      data: {
        status,
        resolvedAt: status === "RESOLVED" ? new Date() : null,
      },
    });

    await auditService.record(ctx, {
      action: `risk.${status.toLowerCase()}`,
      entityType: "RISK",
      entityId: riskId,
      before,
      after: updated,
    });

    return updated;
  },

  async saveExplanation(
    ctx: Ctx,
    riskId: string,
    explanation: unknown,
    evidenceHash: string
  ) {
    requireOrganizer(ctx);
    return prisma.risk.update({
      where: { id: riskId },
      data: {
        aiExplanation: explanation as Prisma.InputJsonValue,
        aiExplainedHash: evidenceHash,
      },
    });
  },

  async getHealthStatus(ctx: Ctx) {
    const openRisks = await prisma.risk.findMany({
      where: { eventId: ctx.eventId, status: "OPEN" },
      select: { severity: true },
    });
    return computeEventHealth(openRisks);
  },
};
