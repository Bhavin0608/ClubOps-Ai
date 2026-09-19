import { prisma } from "@/lib/db";
import { Ctx, requireOrganizer } from "@/lib/api";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { auditService } from "./audit.service";
import { ItemStatus, Level } from "@prisma/client";

export interface CreateMeetingInput {
  title: string;
  meetingDate: Date;
  participants?: string[];
  notes?: string;
  transcript?: string;
}

export interface ExtractedActionItemInput {
  title: string;
  description?: string | null;
  ownerNameRaw?: string | null;
  ownerId?: string | null;
  deadline?: Date | null;
  deadlineRaw?: string | null;
  priority?: Level;
  confidence: number;
  evidence?: string | null;
  ambiguityNote?: string | null;
}

export const meetingService = {
  async list(ctx: Ctx) {
    requireOrganizer(ctx);
    return prisma.meeting.findMany({
      where: { eventId: ctx.eventId },
      include: {
        _count: {
          select: { actionItems: true },
        },
      },
      orderBy: { meetingDate: "desc" },
    });
  },

  async get(ctx: Ctx, meetingId: string) {
    requireOrganizer(ctx);
    const meeting = await prisma.meeting.findFirst({
      where: { id: meetingId, eventId: ctx.eventId },
      include: {
        actionItems: {
          include: {
            owner: { select: { id: true, name: true, email: true, team: true } },
            task: { select: { id: true, title: true, status: true } },
          },
          orderBy: [{ status: "asc" }, { confidence: "desc" }],
        },
      },
    });

    if (!meeting) throw new NotFoundError("Meeting not found");
    return meeting;
  },

  async create(ctx: Ctx, input: CreateMeetingInput) {
    requireOrganizer(ctx);

    const meeting = await prisma.meeting.create({
      data: {
        eventId: ctx.eventId,
        title: input.title,
        meetingDate: input.meetingDate,
        participants: input.participants ?? [],
        notes: input.notes,
        transcript: input.transcript,
        status: "UPLOADED",
        createdById: ctx.userId,
      },
    });

    await auditService.record(ctx, {
      action: "meeting.created",
      entityType: "MEETING",
      entityId: meeting.id,
      after: { title: meeting.title, meetingDate: meeting.meetingDate },
    });

    return meeting;
  },

  async saveExtraction(
    ctx: Ctx,
    meetingId: string,
    summary: string,
    decisions: string[],
    actionItems: ExtractedActionItemInput[]
  ) {
    requireOrganizer(ctx);
    await this.get(ctx, meetingId);

    return prisma.$transaction(async (tx) => {
      // Remove any previously proposed items that were not yet turned into tasks
      await tx.meetingActionItem.deleteMany({
        where: { meetingId, taskId: null },
      });

      const meeting = await tx.meeting.update({
        where: { id: meetingId },
        data: {
          summary,
          decisions,
          status: "PROCESSED",
          processedAt: new Date(),
        },
      });

      if (actionItems.length > 0) {
        await tx.meetingActionItem.createMany({
          data: actionItems.map((item) => ({
            meetingId,
            title: item.title,
            description: item.description ?? null,
            ownerNameRaw: item.ownerNameRaw ?? null,
            ownerId: item.ownerId ?? null,
            deadline: item.deadline ?? null,
            deadlineRaw: item.deadlineRaw ?? null,
            priority: item.priority ?? "MEDIUM",
            confidence: item.confidence,
            evidence: item.evidence ?? null,
            ambiguityNote: item.ambiguityNote ?? null,
            status: "PROPOSED",
          })),
        });
      }

      await tx.auditLog.create({
        data: {
          eventId: ctx.eventId,
          actorUserId: ctx.userId,
          via: ctx.via,
          action: "meeting.extracted",
          entityType: "MEETING",
          entityId: meetingId,
          after: { actionItemsCount: actionItems.length, decisionsCount: decisions.length },
        },
      });

      return this.get(ctx, meetingId);
    });
  },

  async updateActionItem(
    ctx: Ctx,
    itemId: string,
    input: {
      title?: string;
      ownerId?: string | null;
      deadline?: Date | null;
      priority?: Level;
      status?: ItemStatus;
    }
  ) {
    requireOrganizer(ctx);

    const item = await prisma.meetingActionItem.findFirst({
      where: { id: itemId, meeting: { eventId: ctx.eventId } },
    });
    if (!item) throw new NotFoundError("Action item not found");

    return prisma.meetingActionItem.update({
      where: { id: itemId },
      data: input,
    });
  },

  async createTasksFromItems(ctx: Ctx, meetingId: string, itemIds?: string[]) {
    requireOrganizer(ctx);
    const meeting = await this.get(ctx, meetingId);

    const where: { meetingId: string; status: ItemStatus; id?: { in: string[] } } = {
      meetingId,
      status: "PROPOSED",
    };
    if (itemIds && itemIds.length > 0) {
      where.id = { in: itemIds };
    }

    const items = await prisma.meetingActionItem.findMany({
      where,
      include: { owner: true },
    });

    if (items.length === 0) {
      throw new ValidationError("No proposed action items available to convert to tasks");
    }

    const createdTasks = await prisma.$transaction(async (tx) => {
      const taskResults = [];

      for (const item of items) {
        const task = await tx.task.create({
          data: {
            eventId: ctx.eventId,
            title: item.title,
            description: item.description ?? (item.evidence ? `Extracted from meeting: "${item.evidence}"` : undefined),
            status: "TODO",
            priority: item.priority,
            ownerId: item.ownerId,
            team: item.owner?.team,
            deadline: item.deadline,
            source: "MEETING_EXTRACTED",
            createdById: ctx.userId,
          },
        });

        await tx.meetingActionItem.update({
          where: { id: item.id },
          data: {
            status: "APPROVED",
            taskId: task.id,
          },
        });

        taskResults.push(task);
      }

      await tx.auditLog.create({
        data: {
          eventId: ctx.eventId,
          actorUserId: ctx.userId,
          via: ctx.via,
          action: "meeting.tasks_created",
          entityType: "MEETING",
          entityId: meetingId,
          after: { tasksCreatedCount: taskResults.length },
        },
      });

      return taskResults;
    });

    return createdTasks;
  },
};
