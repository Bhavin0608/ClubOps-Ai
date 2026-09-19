import { prisma } from "@/lib/db";
import { Ctx, requireOrganizer } from "@/lib/api";
import { NotFoundError } from "@/lib/errors";
import { auditService } from "./audit.service";
import { MemberRole } from "@prisma/client";

export interface CreateMemberInput {
  name: string;
  email?: string;
  role?: MemberRole;
  team?: string;
  skills?: string[];
  availability?: string;
}

export interface UpdateMemberInput {
  name?: string;
  email?: string;
  role?: MemberRole;
  team?: string;
  skills?: string[];
  availability?: string;
  active?: boolean;
}

export const memberService = {
  async list(ctx: Ctx) {
    const members = await prisma.member.findMany({
      where: { eventId: ctx.eventId, active: true },
      include: {
        tasks: {
          select: {
            id: true,
            status: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return members.map((m) => {
      const openTasks = m.tasks.filter((t) => t.status !== "COMPLETED").length;
      const completedTasks = m.tasks.filter((t) => t.status === "COMPLETED").length;
      return {
        id: m.id,
        name: m.name,
        email: m.email,
        role: m.role,
        team: m.team,
        skills: m.skills,
        availability: m.availability,
        userId: m.userId,
        openTasks,
        completedTasks,
        totalTasks: m.tasks.length,
      };
    });
  },

  async get(ctx: Ctx, memberId: string) {
    const member = await prisma.member.findFirst({
      where: { id: memberId, eventId: ctx.eventId },
    });
    if (!member) throw new NotFoundError("Member not found");
    return member;
  },

  async findByName(ctx: Ctx, name: string) {
    const normalized = name.trim().toLowerCase();
    const members = await prisma.member.findMany({
      where: { eventId: ctx.eventId, active: true },
    });

    // 1. Exact match
    const exact = members.find((m) => m.name.toLowerCase() === normalized);
    if (exact) return exact;

    // 2. Unique first name match
    const firstMatches = members.filter((m) =>
      m.name.toLowerCase().split(" ")[0] === normalized.split(" ")[0]
    );
    if (firstMatches.length === 1) return firstMatches[0];

    return null;
  },

  async create(ctx: Ctx, input: CreateMemberInput) {
    requireOrganizer(ctx);

    // If an email matches an existing registered user, link them automatically
    let linkedUserId: string | null = null;
    if (input.email) {
      const user = await prisma.user.findUnique({ where: { email: input.email } });
      if (user) linkedUserId = user.id;
    }

    const member = await prisma.member.create({
      data: {
        eventId: ctx.eventId,
        name: input.name,
        email: input.email,
        role: input.role ?? "VOLUNTEER",
        team: input.team,
        skills: input.skills ?? [],
        availability: input.availability,
        userId: linkedUserId,
      },
    });

    await auditService.record(ctx, {
      action: "member.created",
      entityType: "MEMBER",
      entityId: member.id,
      after: { name: member.name, role: member.role, team: member.team },
    });

    return member;
  },

  async update(ctx: Ctx, memberId: string, input: UpdateMemberInput) {
    requireOrganizer(ctx);
    const before = await this.get(ctx, memberId);

    const updated = await prisma.member.update({
      where: { id: memberId },
      data: input,
    });

    await auditService.record(ctx, {
      action: "member.updated",
      entityType: "MEMBER",
      entityId: updated.id,
      before,
      after: updated,
    });

    return updated;
  },

  async deactivate(ctx: Ctx, memberId: string) {
    requireOrganizer(ctx);
    return this.update(ctx, memberId, { active: false });
  },

  async delete(ctx: Ctx, memberId: string) {
    requireOrganizer(ctx);
    const before = await this.get(ctx, memberId);
    await prisma.member.delete({ where: { id: memberId } });
    await auditService.record(ctx, {
      action: "member.deleted",
      entityType: "MEMBER",
      entityId: memberId,
      before,
    });
    return { success: true };
  },
};
