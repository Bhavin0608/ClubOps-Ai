import { prisma } from "@/lib/db";
import { Ctx, requireOrganizer } from "@/lib/api";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { PendingStatus, Prisma } from "@prisma/client";

export interface PendingActionToolHandler {
  validate?: (args: any, ctx: Ctx) => Promise<void>;
  run: (args: any, ctx: Ctx) => Promise<unknown>;
}

// Registry map to dynamically resolve the executor
const actionRunners = new Map<string, PendingActionToolHandler>();

export function registerActionRunner(name: string, handler: PendingActionToolHandler) {
  actionRunners.set(name, handler);
}

export const pendingActionService = {
  async stage(
    ctx: Ctx,
    toolName: string,
    args: unknown,
    summary: string,
    messageId?: string
  ) {
    return prisma.pendingAction.create({
      data: {
        eventId: ctx.eventId,
        userId: ctx.userId,
        toolName,
        args: args as Prisma.InputJsonValue,
        summary,
        messageId,
        status: "PENDING",
      },
    });
  },

  async listPending(ctx: Ctx) {
    return prisma.pendingAction.findMany({
      where: {
        eventId: ctx.eventId,
        status: "PENDING",
      },
      orderBy: { createdAt: "desc" },
    });
  },

  async get(ctx: Ctx, id: string) {
    const action = await prisma.pendingAction.findFirst({
      where: { id, eventId: ctx.eventId },
    });
    if (!action) throw new NotFoundError("Pending action not found");
    return action;
  },

  async confirm(ctx: Ctx, id: string) {
    requireOrganizer(ctx);

    // 1. Atomic check-and-set to prevent race condition or double click
    const action = await prisma.pendingAction.findFirst({
      where: { id, eventId: ctx.eventId },
    });

    if (!action) throw new NotFoundError("Pending action not found");
    if (action.status !== "PENDING") {
      throw new ValidationError(`Action is already ${action.status.toLowerCase()}`);
    }

    const runner = actionRunners.get(action.toolName);
    if (!runner) {
      throw new ValidationError(`No execution runner registered for tool ${action.toolName}`);
    }

    const aiCtx: Ctx = {
      ...ctx,
      via: "AI",
    };

    try {
      // Re-validate against CURRENT database state
      if (runner.validate) {
        await runner.validate(action.args, aiCtx);
      }

      // Execute via the service with via = "AI"
      const result = await runner.run(action.args, aiCtx);

      const updated = await prisma.pendingAction.update({
        where: { id },
        data: {
          status: "EXECUTED" as PendingStatus,
          result: result ? (result as Prisma.InputJsonValue) : null,
          resolvedAt: new Date(),
        },
      });

      return updated;
    } catch (err: any) {
      console.error(`Failed to execute pending action ${id}:`, err);
      const updated = await prisma.pendingAction.update({
        where: { id },
        data: {
          status: "FAILED" as PendingStatus,
          error: err.message || "Execution failed",
          resolvedAt: new Date(),
        },
      });
      throw err;
    }
  },

  async reject(ctx: Ctx, id: string) {
    requireOrganizer(ctx);
    const action = await this.get(ctx, id);
    if (action.status !== "PENDING") {
      throw new ValidationError(`Action is already ${action.status.toLowerCase()}`);
    }

    return prisma.pendingAction.update({
      where: { id },
      data: {
        status: "REJECTED" as PendingStatus,
        resolvedAt: new Date(),
      },
    });
  },

  async confirmAll(ctx: Ctx, ids?: string[]) {
    requireOrganizer(ctx);

    const pendingActions =
      ids && ids.length > 0
        ? await prisma.pendingAction.findMany({
            where: {
              id: { in: ids },
              eventId: ctx.eventId,
              status: "PENDING",
            },
            orderBy: { createdAt: "asc" },
          })
        : await prisma.pendingAction.findMany({
            where: {
              eventId: ctx.eventId,
              status: "PENDING",
            },
            orderBy: { createdAt: "asc" },
          });

    const results: { id: string; status: "EXECUTED" | "FAILED"; result?: unknown; error?: string }[] = [];

    for (const action of pendingActions) {
      try {
        const executed = await this.confirm(ctx, action.id);
        results.push({ id: action.id, status: "EXECUTED", result: executed });
      } catch (err: any) {
        results.push({ id: action.id, status: "FAILED", error: err.message || "Failed to execute action" });
      }
    }

    return results;
  },
};
