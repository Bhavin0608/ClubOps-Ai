import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAuthUser, resolveCtx, jsonResponse, handleApiError, requireOrganizer } from "@/lib/api";
import { announcementWorkflow } from "@/server/ai/workflows/announcement.workflow";

export const maxDuration = 60;

const draftSchema = z.object({
  eventId: z.string(),
  purpose: z.string().min(2),
  audience: z.enum(["VOLUNTEERS", "PARTICIPANTS", "ALL"]).optional(),
  tone: z.enum(["urgent", "enthusiastic", "informative", "reminder"]).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuthUser();
    const body = await req.json();
    const { eventId, purpose, audience, tone } = draftSchema.parse(body);

    const ctx = await resolveCtx(user.userId, eventId);
    requireOrganizer(ctx);

    const result = await announcementWorkflow.draft(ctx, { purpose, audience, tone });
    return jsonResponse(result);
  } catch (err) {
    return handleApiError(err);
  }
}
