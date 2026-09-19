import { prisma } from "@/lib/db";
import { Ctx } from "@/lib/api";
import { Prisma } from "@prisma/client";

export interface RecordAuditParams {
  action: string;
  entityType: string;
  entityId: string;
  before?: unknown;
  after?: unknown;
  pendingActionId?: string;
}

export const auditService = {
  async record(ctx: Ctx, params: RecordAuditParams) {
    try {
      return await prisma.auditLog.create({
        data: {
          eventId: ctx.eventId,
          actorUserId: ctx.userId,
          via: ctx.via,
          action: params.action,
          entityType: params.entityType,
          entityId: params.entityId,
          before: params.before ? (params.before as Prisma.InputJsonValue) : null,
          after: params.after ? (params.after as Prisma.InputJsonValue) : null,
          pendingActionId: params.pendingActionId,
        },
      });
    } catch (err) {
      console.error("Failed to write audit log:", err);
      // Non-blocking: audit failure should not crash main transaction if isolated
    }
  },

  async listForEvent(ctx: Ctx, limit = 20) {
    return prisma.auditLog.findMany({
      where: { eventId: ctx.eventId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  },
};
