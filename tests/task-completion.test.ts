import { describe, it, expect, vi, beforeEach } from "vitest";
import { taskService } from "../src/server/services/task.service";
import { ValidationError, ForbiddenError } from "../src/lib/errors";
import { Ctx } from "../src/lib/api";
import { prisma } from "../src/lib/db";

vi.mock("@/lib/db", () => ({
  prisma: {
    task: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    member: {
      findFirst: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
  },
}));

vi.mock("../src/server/services/audit.service", () => ({
  auditService: {
    record: vi.fn().mockResolvedValue(undefined),
  },
}));

describe("Task Completion Lock Constraint", () => {
  const organizerCtx: Ctx = {
    userId: "user-1",
    memberId: "member-org",
    eventId: "event-1",
    role: "ORGANIZER",
    via: "UI",
    now: new Date("2026-09-19T12:00:00Z"),
  };

  const volunteerCtx: Ctx = {
    userId: "user-2",
    memberId: "member-vol",
    eventId: "event-1",
    role: "VOLUNTEER",
    via: "UI",
    now: new Date("2026-09-19T12:00:00Z"),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("prevents updating an assigned completed task to TODO", async () => {
    const existingTask = {
      id: "task-100",
      eventId: "event-1",
      title: "Deliver Sound System",
      status: "COMPLETED",
      ownerId: "member-vol",
      completedAt: new Date("2026-09-19T10:00:00Z"),
    };

    vi.mocked(prisma.task.findFirst).mockResolvedValue(existingTask as any);

    await expect(
      taskService.update(volunteerCtx, "task-100", { status: "TODO" })
    ).rejects.toThrow(ValidationError);

    await expect(
      taskService.update(volunteerCtx, "task-100", { status: "TODO" })
    ).rejects.toThrow("A task that is assigned and completed cannot be changed to another status");

    // Ensure database update was never executed
    expect(prisma.task.update).not.toHaveBeenCalled();
  });

  it("prevents updating an assigned completed task to IN_PROGRESS or BLOCKED even by organizer", async () => {
    const existingTask = {
      id: "task-101",
      eventId: "event-1",
      title: "Stage Setup",
      status: "COMPLETED",
      ownerId: "member-vol",
      completedAt: new Date("2026-09-19T10:00:00Z"),
    };

    vi.mocked(prisma.task.findFirst).mockResolvedValue(existingTask as any);

    await expect(
      taskService.update(organizerCtx, "task-101", { status: "IN_PROGRESS" })
    ).rejects.toThrow(ValidationError);

    await expect(
      taskService.update(organizerCtx, "task-101", { status: "BLOCKED" })
    ).rejects.toThrow("A task that is assigned and completed cannot be changed to another status");

    expect(prisma.task.update).not.toHaveBeenCalled();
  });

  it("allows setting status to COMPLETED from IN_PROGRESS for assigned task", async () => {
    const existingTask = {
      id: "task-102",
      eventId: "event-1",
      title: "Print Badges",
      status: "IN_PROGRESS",
      ownerId: "member-vol",
      completedAt: null,
    };

    const updatedTask = {
      ...existingTask,
      status: "COMPLETED",
      completedAt: volunteerCtx.now,
    };

    vi.mocked(prisma.task.findFirst).mockResolvedValue(existingTask as any);
    vi.mocked(prisma.task.update).mockResolvedValue(updatedTask as any);

    await taskService.update(volunteerCtx, "task-102", { status: "COMPLETED" });
    expect(prisma.task.update).toHaveBeenCalledWith({
      where: { id: "task-102" },
      data: {
        status: "COMPLETED",
        completedAt: volunteerCtx.now,
      },
    });
  });

  it("allows idempotent COMPLETED update on an already completed assigned task", async () => {
    const existingTask = {
      id: "task-103",
      eventId: "event-1",
      title: "Print Badges",
      status: "COMPLETED",
      ownerId: "member-vol",
      completedAt: new Date("2026-09-19T10:00:00Z"),
    };

    vi.mocked(prisma.task.findFirst).mockResolvedValue(existingTask as any);
    vi.mocked(prisma.task.update).mockResolvedValue(existingTask as any);

    await expect(
      taskService.update(volunteerCtx, "task-103", { status: "COMPLETED" })
    ).resolves.toBeDefined();
  });
});
