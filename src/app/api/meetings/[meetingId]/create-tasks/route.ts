import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAuthUser, resolveCtx, jsonResponse, handleApiError } from "@/lib/api";
import { meetingService } from "@/server/services/meeting.service";
import { prisma } from "@/lib/db";
import { NotFoundError } from "@/lib/errors";

const createTasksSchema = z.object({
  itemIds: z.array(z.string()).optional(),
});

export async function POST(
  req: NextRequest,
  props: { params: Promise<{ meetingId: string }> }
) {
  try {
    const params = await props.params;
    const user = await requireAuthUser();

    const existing = await prisma.meeting.findUnique({
      where: { id: params.meetingId },
      select: { eventId: true },
    });
    if (!existing) throw new NotFoundError("Meeting not found");

    const ctx = await resolveCtx(user.userId, existing.eventId);
    const body = await req.json().catch(() => ({}));
    const { itemIds } = createTasksSchema.parse(body);

    const createdTasks = await meetingService.createTasksFromItems(ctx, params.meetingId, itemIds);
    return jsonResponse(createdTasks);
  } catch (err) {
    return handleApiError(err);
  }
}
