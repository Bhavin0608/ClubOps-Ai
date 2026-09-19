import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAuthUser, resolveCtx, jsonResponse, handleApiError } from "@/lib/api";
import { meetingService } from "@/server/services/meeting.service";

const createMeetingSchema = z.object({
  title: z.string().min(2, "Meeting title is required"),
  meetingDate: z.string().transform((s) => new Date(s)),
  participants: z.array(z.string()).optional(),
  notes: z.string().optional(),
  transcript: z.string().optional(),
});

export async function GET(
  _req: NextRequest,
  props: { params: Promise<{ eventId: string }> }
) {
  try {
    const params = await props.params;
    const user = await requireAuthUser();
    const ctx = await resolveCtx(user.userId, params.eventId);
    const meetings = await meetingService.list(ctx);
    return jsonResponse(meetings);
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
    const data = createMeetingSchema.parse(body);

    const meeting = await meetingService.create(ctx, data);
    return jsonResponse(meeting, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
