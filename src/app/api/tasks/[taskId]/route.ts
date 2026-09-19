import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAuthUser, resolveCtx, jsonResponse, handleApiError } from "@/lib/api";
import { taskService } from "@/server/services/task.service";
import { prisma } from "@/lib/db";
import { NotFoundError } from "@/lib/errors";

const updateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "BLOCKED", "COMPLETED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  ownerId: z.string().nullable().optional(),
  team: z.string().optional(),
  deadline: z.string().transform((s) => new Date(s)).nullable().optional(),
});

export async function PATCH(
  req: NextRequest,
  props: { params: Promise<{ taskId: string }> }
) {
  try {
    const params = await props.params;
    const user = await requireAuthUser();

    // Look up task to determine eventId
    const existing = await prisma.task.findUnique({
      where: { id: params.taskId },
      select: { eventId: true },
    });
    if (!existing) throw new NotFoundError("Task not found");

    const ctx = await resolveCtx(user.userId, existing.eventId);
    const body = await req.json();
    const data = updateTaskSchema.parse(body);

    const updated = await taskService.update(ctx, params.taskId, data);
    return jsonResponse(updated);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(
  _req: NextRequest,
  props: { params: Promise<{ taskId: string }> }
) {
  try {
    const params = await props.params;
    const user = await requireAuthUser();

    const existing = await prisma.task.findUnique({
      where: { id: params.taskId },
      select: { eventId: true },
    });
    if (!existing) throw new NotFoundError("Task not found");

    const ctx = await resolveCtx(user.userId, existing.eventId);
    const result = await taskService.delete(ctx, params.taskId);
    return jsonResponse(result);
  } catch (err) {
    return handleApiError(err);
  }
}
