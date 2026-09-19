import { prisma } from "@/lib/db";
import { Ctx, requireOrganizer } from "@/lib/api";
import { ForbiddenError, NotFoundError, ValidationError } from "@/lib/errors";
import { auditService } from "./audit.service";
import { Level, TaskSource, TaskStatus } from "@prisma/client";
import { ALLOWED_TASK_TRANSITIONS } from "@/components/shared/StatusBadge";

export interface CreateTaskInput {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: Level;
  ownerId?: string | null;
  team?: string;
  deadline?: Date | null;
  source?: TaskSource;
  prerequisiteIds?: string[];
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: Level;
  ownerId?: string | null;
  team?: string;
  deadline?: Date | null;
}

export interface TaskFilterOptions {
  status?: TaskStatus;
  ownerId?: string;
  team?: string;
  priority?: Level;
  overdueOnly?: boolean;
  search?: string;
}

// DFS cycle detection for BR-4
async function checkForDependencyCycle(
  eventId: string,
  taskId: string,
  prerequisiteIds: string[]
): Promise<void> {
  if (prerequisiteIds.includes(taskId)) {
    throw new ValidationError("A task cannot depend on itself");
  }

  // Fetch all existing dependency pairs for this event
  const allDeps = await prisma.taskDependency.findMany({
    where: { task: { eventId } },
    select: { taskId: true, prerequisiteId: true },
  });

  // Build adjacency list: target -> list of tasks that it waits on
  const adj = new Map<string, string[]>();
  for (const dep of allDeps) {
    if (dep.taskId !== taskId) {
      const list = adj.get(dep.taskId) ?? [];
      list.push(dep.prerequisiteId);
      adj.set(dep.taskId, list);
    }
  }
  adj.set(taskId, prerequisiteIds);

  // Check if there is a path from any prerequisite back to taskId
  const visited = new Set<string>();
  const recStack = new Set<string>();

  function dfs(curr: string): boolean {
    visited.add(curr);
    recStack.add(curr);

    const neighbors = adj.get(curr) ?? [];
    for (const next of neighbors) {
      if (!visited.has(next)) {
        if (dfs(next)) return true;
      } else if (recStack.has(next)) {
        return true; // Cycle detected
      }
    }

    recStack.delete(curr);
    return false;
  }

  for (const node of adj.keys()) {
    if (!visited.has(node)) {
      if (dfs(node)) {
        throw new ValidationError("Cyclic dependency detected: tasks cannot have circular prerequisites");
      }
    }
  }
}

export const taskService = {
  async list(ctx: Ctx, filters?: TaskFilterOptions) {
    const where: Record<string, unknown> = {
      eventId: ctx.eventId,
    };

    if (filters?.status) where.status = filters.status;
    if (filters?.ownerId) where.ownerId = filters.ownerId;
    if (filters?.team) where.team = filters.team;
    if (filters?.priority) where.priority = filters.priority;
    if (filters?.overdueOnly) {
      where.deadline = { lt: ctx.now };
      where.status = { not: "COMPLETED" };
    }
    if (filters?.search) {
      where.OR = [
        { title: { contains: filters.search, mode: "insensitive" } },
        { description: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    return prisma.task.findMany({
      where,
      include: {
        owner: { select: { id: true, name: true, email: true, team: true } },
        prerequisites: {
          include: {
            prerequisite: { select: { id: true, title: true, status: true, deadline: true } },
          },
        },
        dependents: {
          include: {
            task: { select: { id: true, title: true, status: true, deadline: true } },
          },
        },
      },
      orderBy: [{ deadline: "asc" }, { createdAt: "desc" }],
    });
  },

  async get(ctx: Ctx, taskId: string) {
    const task = await prisma.task.findFirst({
      where: { id: taskId, eventId: ctx.eventId },
      include: {
        owner: true,
        prerequisites: {
          include: {
            prerequisite: { select: { id: true, title: true, status: true, deadline: true, priority: true } },
          },
        },
        dependents: {
          include: {
            task: { select: { id: true, title: true, status: true, deadline: true, priority: true } },
          },
        },
      },
    });

    if (!task) throw new NotFoundError("Task not found");
    return task;
  },

  async create(ctx: Ctx, input: CreateTaskInput) {
    requireOrganizer(ctx);

    // BR-2: Verify owner is active member of same event
    if (input.ownerId) {
      const member = await prisma.member.findFirst({
        where: { id: input.ownerId, eventId: ctx.eventId, active: true },
      });
      if (!member) throw new ValidationError("Selected owner is not an active member of this event");
    }

    const task = await prisma.task.create({
      data: {
        eventId: ctx.eventId,
        title: input.title,
        description: input.description,
        status: input.status ?? "TODO",
        priority: input.priority ?? "MEDIUM",
        ownerId: input.ownerId ?? null,
        team: input.team,
        deadline: input.deadline ?? null,
        source: input.source ?? "MANUAL",
        createdById: ctx.userId,
      },
    });

    if (input.prerequisiteIds && input.prerequisiteIds.length > 0) {
      await this.setDependencies(ctx, task.id, input.prerequisiteIds);
    }

    await auditService.record(ctx, {
      action: "task.created",
      entityType: "TASK",
      entityId: task.id,
      after: { title: task.title, priority: task.priority, deadline: task.deadline },
    });

    return this.get(ctx, task.id);
  },

  async createMany(ctx: Ctx, tasks: CreateTaskInput[]) {
    requireOrganizer(ctx);
    const created: string[] = [];

    for (const t of tasks) {
      const res = await this.create(ctx, t);
      created.push(res.id);
    }

    return created;
  },

  async update(ctx: Ctx, taskId: string, input: UpdateTaskInput) {
    const before = await this.get(ctx, taskId);

    // BR-3: Volunteers may ONLY update status of tasks they own
    if (ctx.role === "VOLUNTEER") {
      if (before.ownerId !== ctx.memberId) {
        throw new ForbiddenError("Volunteers can only update tasks assigned to them");
      }
      const allowedKeys = Object.keys(input);
      if (allowedKeys.length !== 1 || !allowedKeys.includes("status")) {
        throw new ForbiddenError("Volunteers may only modify task status");
      }
    }

    // BR-2: Verify owner if changed
    if (input.ownerId !== undefined && input.ownerId !== null) {
      const member = await prisma.member.findFirst({
        where: { id: input.ownerId, eventId: ctx.eventId, active: true },
      });
      if (!member) throw new ValidationError("Owner must be an active member of this event");
    }

    // Status state machine transitions check (Rules: a, b, c, d)
    if (input.status && input.status !== before.status) {
      const allowed = ALLOWED_TASK_TRANSITIONS[before.status as TaskStatus] ?? [];
      if (!allowed.includes(input.status)) {
        if (before.status === "COMPLETED") {
          throw new ValidationError("A completed task cannot be changed to any other status");
        }
        if (before.status === "TODO" && input.status !== "IN_PROGRESS") {
          throw new ValidationError("A task in To-Do state can only be transitioned to In Progress");
        }
        if (before.status === "BLOCKED" && input.status !== "IN_PROGRESS") {
          throw new ValidationError("A blocked task can only be transitioned back to In Progress");
        }
        if (input.status === "TODO") {
          throw new ValidationError("Tasks cannot be reverted back to To Do once in progress or blocked");
        }
        throw new ValidationError(`Cannot transition task status from ${before.status} to ${input.status}`);
      }
    }

    // BR-5: CompletedAt tracking
    let completedAt: Date | null = before.completedAt;
    if (input.status === "COMPLETED" && before.status !== "COMPLETED") {
      completedAt = ctx.now;
    } else if (input.status && input.status !== "COMPLETED") {
      completedAt = null;
    }

    const updated = await prisma.task.update({
      where: { id: taskId },
      data: {
        ...input,
        completedAt,
      },
    });

    await auditService.record(ctx, {
      action: "task.updated",
      entityType: "TASK",
      entityId: taskId,
      before,
      after: updated,
    });

    return this.get(ctx, taskId);
  },

  async assign(ctx: Ctx, taskId: string, ownerId: string | null) {
    requireOrganizer(ctx);
    return this.update(ctx, taskId, { ownerId });
  },

  async changeDeadline(ctx: Ctx, taskId: string, deadline: Date | null) {
    requireOrganizer(ctx);
    return this.update(ctx, taskId, { deadline });
  },

  async updateStatus(ctx: Ctx, taskId: string, status: TaskStatus) {
    return this.update(ctx, taskId, { status });
  },

  async setDependencies(ctx: Ctx, taskId: string, prerequisiteIds: string[]) {
    requireOrganizer(ctx);
    await this.get(ctx, taskId);

    // Verify all prerequisites belong to the same event
    if (prerequisiteIds.length > 0) {
      const validPrereqs = await prisma.task.findMany({
        where: { id: { in: prerequisiteIds }, eventId: ctx.eventId },
        select: { id: true },
      });
      if (validPrereqs.length !== prerequisiteIds.length) {
        throw new ValidationError("One or more prerequisite tasks do not exist in this event");
      }
      await checkForDependencyCycle(ctx.eventId, taskId, prerequisiteIds);
    }

    return prisma.$transaction(async (tx) => {
      await tx.taskDependency.deleteMany({
        where: { taskId },
      });

      if (prerequisiteIds.length > 0) {
        await tx.taskDependency.createMany({
          data: prerequisiteIds.map((pId) => ({
            taskId,
            prerequisiteId: pId,
          })),
        });
      }

      await tx.auditLog.create({
        data: {
          eventId: ctx.eventId,
          actorUserId: ctx.userId,
          via: ctx.via,
          action: "task.dependencies_changed",
          entityType: "TASK",
          entityId: taskId,
          after: { prerequisiteIds },
        },
      });

      return this.get(ctx, taskId);
    });
  },

  async delete(ctx: Ctx, taskId: string) {
    requireOrganizer(ctx);
    const before = await this.get(ctx, taskId);
    await prisma.task.delete({ where: { id: taskId } });

    await auditService.record(ctx, {
      action: "task.deleted",
      entityType: "TASK",
      entityId: taskId,
      before,
    });

    return { success: true };
  },
};
