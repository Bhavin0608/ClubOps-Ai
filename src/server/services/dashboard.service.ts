import { prisma } from "@/lib/db";
import { Ctx } from "@/lib/api";
import { differenceInDays, isBefore } from "date-fns";

export const dashboardService = {
  async metrics(ctx: Ctx) {
    const event = await prisma.event.findUnique({
      where: { id: ctx.eventId },
    });

    const tasks = await prisma.task.findMany({
      where: { eventId: ctx.eventId },
      select: { id: true, status: true, deadline: true, priority: true },
    });

    const openRisks = await prisma.risk.count({
      where: { eventId: ctx.eventId, status: "OPEN" },
    });

    const activeMembers = await prisma.member.count({
      where: { eventId: ctx.eventId, active: true },
    });

    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === "COMPLETED").length;
    const overdue = tasks.filter(
      (t) => t.status !== "COMPLETED" && t.deadline && isBefore(t.deadline, ctx.now)
    ).length;

    // Countdown days to event start
    const countdownDays = event ? differenceInDays(event.startDate, ctx.now) : 0;

    return {
      totalTasks: total,
      completedTasks: completed,
      overdueTasks: overdue,
      openRisks,
      activeMembers,
      expectedParticipants: event?.expectedParticipants ?? 0,
      countdownDays,
      eventStatus: event?.status ?? "PLANNING",
      eventName: event?.name ?? "",
      startDate: event?.startDate,
      endDate: event?.endDate,
      venue: event?.venue,
    };
  },

  async upcomingDeadlines(ctx: Ctx, limit = 5) {
    return prisma.task.findMany({
      where: {
        eventId: ctx.eventId,
        status: { not: "COMPLETED" },
        deadline: { not: null },
      },
      include: {
        owner: { select: { id: true, name: true, team: true } },
      },
      orderBy: { deadline: "asc" },
      take: limit,
    });
  },

  async workload(ctx: Ctx) {
    const members = await prisma.member.findMany({
      where: { eventId: ctx.eventId, active: true },
      include: {
        tasks: {
          select: { id: true, status: true },
        },
      },
      orderBy: { name: "asc" },
    });

    return members.map((m) => {
      const open = m.tasks.filter((t) => t.status !== "COMPLETED").length;
      const done = m.tasks.filter((t) => t.status === "COMPLETED").length;
      return {
        id: m.id,
        name: m.name,
        role: m.role,
        team: m.team,
        openTasks: open,
        completedTasks: done,
        isOverloaded: open >= 6,
      };
    });
  },

  async recentActivity(ctx: Ctx, limit = 10) {
    return prisma.auditLog.findMany({
      where: { eventId: ctx.eventId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  },
};
