import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAuthUser, resolveCtx, jsonResponse, handleApiError } from "@/lib/api";
import { announcementService } from "@/server/services/announcement.service";
import { prisma } from "@/lib/db";
import { NotFoundError } from "@/lib/errors";

const updateAnnouncementSchema = z.object({
  title: z.string().min(2).optional(),
  content: z.string().min(2).optional(),
  audience: z.enum(["VOLUNTEERS", "PARTICIPANTS", "ALL"]).optional(),
});

export async function PATCH(
  req: NextRequest,
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
    const body = await req.json();
    const data = updateAnnouncementSchema.parse(body);

    const updated = await announcementService.update(ctx, params.id, data);
    return jsonResponse(updated);
  } catch (err) {
    return handleApiError(err);
  }
}
