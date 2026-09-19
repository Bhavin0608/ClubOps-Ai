import { prisma } from "@/lib/db";
import { Ctx, requireOrganizer } from "@/lib/api";
import { auditService } from "./audit.service";

export interface SaveMemoryInput {
  category?: "PREFERENCE" | "CORRECTION" | "RULE" | "FEEDBACK";
  key: string;
  instruction: string;
  confidence?: number;
}

export interface OperationalMemoryRecord {
  id: string;
  eventId: string;
  category: string;
  key: string;
  instruction: string;
  confidence: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export const memoryService = {
  async save(ctx: Ctx, input: SaveMemoryInput): Promise<OperationalMemoryRecord> {
    requireOrganizer(ctx);

    const existing = await prisma.operationalMemory.findFirst({
      where: {
        eventId: ctx.eventId,
        key: { equals: input.key, mode: "insensitive" },
      },
    });

    let record: OperationalMemoryRecord;
    if (existing) {
      record = await prisma.operationalMemory.update({
        where: { id: existing.id },
        data: {
          category: input.category ?? existing.category,
          instruction: input.instruction,
          confidence: input.confidence ?? 1.0,
        },
      });
    } else {
      record = await prisma.operationalMemory.create({
        data: {
          eventId: ctx.eventId,
          category: input.category ?? "PREFERENCE",
          key: input.key,
          instruction: input.instruction,
          confidence: input.confidence ?? 1.0,
        },
      });
    }

    await auditService.record(ctx, {
      action: existing ? "memory.updated" : "memory.created",
      entityType: "MEMORY",
      entityId: record.id,
      after: { key: record.key, instruction: record.instruction, category: record.category },
    });

    return record;
  },

  async list(ctx: Ctx): Promise<OperationalMemoryRecord[]> {
    try {
      const records = await prisma.operationalMemory.findMany({
        where: { eventId: ctx.eventId },
        orderBy: { updatedAt: "desc" },
      });
      return records as OperationalMemoryRecord[];
    } catch (err) {
      console.warn("Failed to load operational memories from database:", err);
      return [];
    }
  },

  async delete(ctx: Ctx, memoryId: string): Promise<{ success: boolean }> {
    requireOrganizer(ctx);
    const existing = await prisma.operationalMemory.findFirst({
      where: { id: memoryId, eventId: ctx.eventId },
    });
    if (!existing) return { success: false };

    await prisma.operationalMemory.delete({ where: { id: memoryId } });
    await auditService.record(ctx, {
      action: "memory.deleted",
      entityType: "MEMORY",
      entityId: memoryId,
      before: existing,
    });
    return { success: true };
  },
};
