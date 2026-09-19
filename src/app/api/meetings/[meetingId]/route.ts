import { NextRequest } from "next/server";
import { requireAuthUser, resolveCtx, jsonResponse, handleApiError } from "@/lib/api";
import { meetingService } from "@/server/services/meeting.service";
import { prisma } from "@/lib/db";
import { NotFoundError } from "@/lib/errors";

export async function GET(
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
    const meeting = await meetingService.get(ctx, params.meetingId);
    return jsonResponse(meeting);
  } catch (err) {
    return handleApiError(err);
  }
}
