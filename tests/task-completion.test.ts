import { describe, it, expect, vi, beforeEach } from "vitest";
import { taskService } from "../src/server/services/task.service";
import { ValidationError } from "../src/lib/errors";
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

describe("Task State Machine Transition Constraints (Rules a, b, c, d)", () => {
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

  describe("Rule a: Task in 'To-Do' next state can only be in-progress (start task)", () => {
    it("allows transitioning from TODO to IN_PROGRESS", async () => {
      const task = {
        id: "task-todo-1",
        eventId: "event-1",
        title: "Setup Booth",
        status: "TODO",
        ownerId: "member-vol",
      };
      vi.mocked(prisma.task.findFirst).mockResolvedValue(task as any);
      vi.mocked(prisma.task.update).mockResolvedValue({ ...task, status: "IN_PROGRESS" } as any);

      await expect(
        taskService.update(volunteerCtx, "task-todo-1", { status: "IN_PROGRESS" })
      ).resolves.toBeDefined();
    });

    it("rejects transitioning directly from TODO to BLOCKED", async () => {
      const task = {
        id: "task-todo-2",
        eventId: "event-1",
        title: "Setup Booth",
        status: "TODO",
        ownerId: "member-vol",
      };
      vi.mocked(prisma.task.findFirst).mockResolvedValue(task as any);

      await expect(
        taskService.update(volunteerCtx, "task-todo-2", { status: "BLOCKED" })
      ).rejects.toThrow("A task in To-Do state can only be transitioned to In Progress");
      expect(prisma.task.update).not.toHaveBeenCalled();
    });

    it("rejects transitioning directly from TODO to COMPLETED", async () => {
      const task = {
        id: "task-todo-3",
        eventId: "event-1",
        title: "Setup Booth",
        status: "TODO",
        ownerId: "member-vol",
      };
      vi.mocked(prisma.task.findFirst).mockResolvedValue(task as any);

      await expect(
        taskService.update(volunteerCtx, "task-todo-3", { status: "COMPLETED" })
      ).rejects.toThrow("A task in To-Do state can only be transitioned to In Progress");
      expect(prisma.task.update).not.toHaveBeenCalled();
    });
  });

  describe("Rule b: Task in progress can either be transferred to completed or blocked", () => {
    it("allows transitioning from IN_PROGRESS to BLOCKED", async () => {
      const task = {
        id: "task-prog-1",
        eventId: "event-1",
        title: "Install Lights",
        status: "IN_PROGRESS",
        ownerId: "member-vol",
      };
      vi.mocked(prisma.task.findFirst).mockResolvedValue(task as any);
      vi.mocked(prisma.task.update).mockResolvedValue({ ...task, status: "BLOCKED" } as any);

      await expect(
        taskService.update(volunteerCtx, "task-prog-1", { status: "BLOCKED" })
      ).resolves.toBeDefined();
    });

    it("allows transitioning from IN_PROGRESS to COMPLETED", async () => {
      const task = {
        id: "task-prog-2",
        eventId: "event-1",
        title: "Install Lights",
        status: "IN_PROGRESS",
        ownerId: "member-vol",
      };
      vi.mocked(prisma.task.findFirst).mockResolvedValue(task as any);
      vi.mocked(prisma.task.update).mockResolvedValue({
        ...task,
        status: "COMPLETED",
        completedAt: volunteerCtx.now,
      } as any);

      await expect(
        taskService.update(volunteerCtx, "task-prog-2", { status: "COMPLETED" })
      ).resolves.toBeDefined();
    });

    it("rejects reverting from IN_PROGRESS back to TODO", async () => {
      const task = {
        id: "task-prog-3",
        eventId: "event-1",
        title: "Install Lights",
        status: "IN_PROGRESS",
        ownerId: "member-vol",
      };
      vi.mocked(prisma.task.findFirst).mockResolvedValue(task as any);

      await expect(
        taskService.update(volunteerCtx, "task-prog-3", { status: "TODO" })
      ).rejects.toThrow("Tasks cannot be reverted back to To Do once in progress or blocked");
      expect(prisma.task.update).not.toHaveBeenCalled();
    });
  });

  describe("Rule c: Task in blocked state can be transferred back ONLY to in progress state and no other state", () => {
    it("allows transitioning from BLOCKED to IN_PROGRESS", async () => {
      const task = {
        id: "task-block-1",
        eventId: "event-1",
        title: "Waiting on cables",
        status: "BLOCKED",
        ownerId: "member-vol",
      };
      vi.mocked(prisma.task.findFirst).mockResolvedValue(task as any);
      vi.mocked(prisma.task.update).mockResolvedValue({ ...task, status: "IN_PROGRESS" } as any);

      await expect(
        taskService.update(volunteerCtx, "task-block-1", { status: "IN_PROGRESS" })
      ).resolves.toBeDefined();
    });

    it("rejects transitioning directly from BLOCKED to COMPLETED", async () => {
      const task = {
        id: "task-block-2",
        eventId: "event-1",
        title: "Waiting on cables",
        status: "BLOCKED",
        ownerId: "member-vol",
      };
      vi.mocked(prisma.task.findFirst).mockResolvedValue(task as any);

      await expect(
        taskService.update(volunteerCtx, "task-block-2", { status: "COMPLETED" })
      ).rejects.toThrow("A blocked task can only be transitioned back to In Progress");
      expect(prisma.task.update).not.toHaveBeenCalled();
    });

    it("rejects transitioning from BLOCKED to TODO", async () => {
      const task = {
        id: "task-block-3",
        eventId: "event-1",
        title: "Waiting on cables",
        status: "BLOCKED",
        ownerId: "member-vol",
      };
      vi.mocked(prisma.task.findFirst).mockResolvedValue(task as any);

      await expect(
        taskService.update(volunteerCtx, "task-block-3", { status: "TODO" })
      ).rejects.toThrow("A blocked task can only be transitioned back to In Progress");
      expect(prisma.task.update).not.toHaveBeenCalled();
    });
  });

  describe("Rule d: Once a task is deemed completed, it cannot revert back to any other state", () => {
    it("rejects changing COMPLETED to TODO, IN_PROGRESS, or BLOCKED", async () => {
      const task = {
        id: "task-comp-1",
        eventId: "event-1",
        title: "Keynote Prep",
        status: "COMPLETED",
        ownerId: "member-vol",
        completedAt: new Date("2026-09-19T10:00:00Z"),
      };
      vi.mocked(prisma.task.findFirst).mockResolvedValue(task as any);

      await expect(
        taskService.update(organizerCtx, "task-comp-1", { status: "TODO" })
      ).rejects.toThrow("A completed task cannot be changed to any other status");

      await expect(
        taskService.update(organizerCtx, "task-comp-1", { status: "IN_PROGRESS" })
      ).rejects.toThrow("A completed task cannot be changed to any other status");

      await expect(
        taskService.update(volunteerCtx, "task-comp-1", { status: "BLOCKED" })
      ).rejects.toThrow("A completed task cannot be changed to any other status");

      expect(prisma.task.update).not.toHaveBeenCalled();
    });

    it("allows idempotent COMPLETED update", async () => {
      const task = {
        id: "task-comp-2",
        eventId: "event-1",
        title: "Keynote Prep",
        status: "COMPLETED",
        ownerId: "member-vol",
        completedAt: new Date("2026-09-19T10:00:00Z"),
      };
      vi.mocked(prisma.task.findFirst).mockResolvedValue(task as any);
      vi.mocked(prisma.task.update).mockResolvedValue(task as any);

      await expect(
        taskService.update(volunteerCtx, "task-comp-2", { status: "COMPLETED" })
      ).resolves.toBeDefined();
    });
  });
});
