import { NextRequest } from "next/server";
import { requireAuthUser, resolveCtx, jsonResponse, handleApiError } from "@/lib/api";
import { announcementService } from "@/server/services/announcement.service";
import { prisma } from "@/lib/db";
import { NotFoundError } from "@/lib/errors";

export async function POST(
  _req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const user = await requireAuthUser();

    const existing = await prisma.announcement.findUnique({
      where: { id: params.id },
      select: { eventId: true },
    });
    if (!existing) throw new NotFoundError("Announcement not found");

    const ctx = await resolveCtx(user.userId, existing.eventId);
    const published = await announcementService.publish(ctx, params.id);
    return jsonResponse(published);
  } catch (err) {
    return handleApiError(err);
  }
}
