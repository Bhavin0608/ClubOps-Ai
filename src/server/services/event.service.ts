import { prisma } from "@/lib/db";
import { Ctx, requireOrganizer } from "@/lib/api";
import { NotFoundError } from "@/lib/errors";
import { auditService } from "./audit.service";
import { EventStatus } from "@prisma/client";

export interface CreateEventInput {
  name: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  venue?: string;
  expectedParticipants?: number;
}

export interface UpdateEventInput {
  name?: string;
  description?: string;
  startDate?: Date;
  endDate?: Date;
  venue?: string;
  expectedParticipants?: number;
  status?: EventStatus;
}

export const eventService = {
  async listForUser(userId: string) {
    const memberships = await prisma.member.findMany({
      where: { userId, active: true },
      include: {
        event: true,
      },
      orderBy: { event: { startDate: "asc" } },
    });
    return memberships.map((m) => ({
      ...m.event,
      role: m.role,
      memberId: m.id,
    }));
  },

  async get(ctx: Ctx) {
    const event = await prisma.event.findUnique({
      where: { id: ctx.eventId },
      include: {
        _count: {
          select: {
            tasks: true,
            members: true,
            risks: { where: { status: "OPEN" } },
            meetings: true,
          },
        },
      },
    });

    if (!event) throw new NotFoundError("Event not found");
    return event;
  },

  async create(userId: string, input: CreateEventInput) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError("User not found");

    return prisma.$transaction(async (tx) => {
      const event = await tx.event.create({
        data: {
          name: input.name,
          description: input.description,
          startDate: input.startDate,
          endDate: input.endDate,
          venue: input.venue,
          expectedParticipants: input.expectedParticipants,
          createdById: userId,
        },
      });

      // Creator automatically becomes an ORGANIZER member
      const member = await tx.member.create({
        data: {
          eventId: event.id,
          userId,
          name: user.name,
          email: user.email,
          role: "ORGANIZER",
          team: "Core",
        },
      });

      await tx.auditLog.create({
        data: {
          eventId: event.id,
          actorUserId: userId,
          via: "UI",
          action: "event.created",
          entityType: "EVENT",
          entityId: event.id,
          after: { name: event.name, startDate: event.startDate },
        },
      });

      return { event, member };
    });
  },

  async update(ctx: Ctx, input: UpdateEventInput) {
    requireOrganizer(ctx);
    const before = await prisma.event.findUnique({ where: { id: ctx.eventId } });
    if (!before) throw new NotFoundError("Event not found");

    const updated = await prisma.event.update({
      where: { id: ctx.eventId },
      data: input,
    });

    await auditService.record(ctx, {
      action: "event.updated",
      entityType: "EVENT",
      entityId: updated.id,
      before,
      after: updated,
    });

    return updated;
  },
};
