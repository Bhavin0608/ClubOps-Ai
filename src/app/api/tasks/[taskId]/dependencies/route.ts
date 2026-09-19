import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAuthUser, resolveCtx, jsonResponse, handleApiError } from "@/lib/api";
import { taskService } from "@/server/services/task.service";
import { prisma } from "@/lib/db";
import { NotFoundError } from "@/lib/errors";

const dependenciesSchema = z.object({
  prerequisiteIds: z.array(z.string()),
});

export async function PUT(
  req: NextRequest,
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
    const body = await req.json();
    const { prerequisiteIds } = dependenciesSchema.parse(body);

    const updated = await taskService.setDependencies(ctx, params.taskId, prerequisiteIds);
    return jsonResponse(updated);
  } catch (err) {
    return handleApiError(err);
  }
}
