import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAuthUser, resolveCtx, jsonResponse, handleApiError } from "@/lib/api";
import { announcementService } from "@/server/services/announcement.service";

const createAnnouncementSchema = z.object({
  title: z.string().min(2, "Title is required"),
  content: z.string().min(2, "Content is required"),
  audience: z.enum(["VOLUNTEERS", "PARTICIPANTS", "ALL"]).optional(),
});

export async function GET(
  _req: NextRequest,
  props: { params: Promise<{ eventId: string }> }
) {
  try {
    const params = await props.params;
    const user = await requireAuthUser();
    const ctx = await resolveCtx(user.userId, params.eventId);
    const list = await announcementService.list(ctx);
    return jsonResponse(list);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(
  req: NextRequest,
  props: { params: Promise<{ eventId: string }> }
) {
  try {
    const params = await props.params;
    const user = await requireAuthUser();
    const ctx = await resolveCtx(user.userId, params.eventId);

    const body = await req.json();
    const data = createAnnouncementSchema.parse(body);

    const announcement = await announcementService.createDraft(ctx, data);
    return jsonResponse(announcement, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
