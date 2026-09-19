import { NextRequest } from "next/server";
import { requireAuthUser, resolveCtx, jsonResponse, handleApiError } from "@/lib/api";
import { meetingWorkflow } from "@/server/ai/workflows/meeting.workflow";
import { prisma } from "@/lib/db";
import { NotFoundError } from "@/lib/errors";

export const maxDuration = 60;

export async function POST(
  _req: NextRequest,
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
    const result = await meetingWorkflow.process(ctx, params.meetingId);
    return jsonResponse(result);
  } catch (err) {
    return handleApiError(err);
  }
}
