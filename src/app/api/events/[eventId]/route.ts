import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAuthUser, resolveCtx, jsonResponse, handleApiError } from "@/lib/api";
import { eventService } from "@/server/services/event.service";

const updateEventSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  startDate: z.string().transform((s) => new Date(s)).optional(),
  endDate: z.string().transform((s) => new Date(s)).optional(),
  venue: z.string().optional(),
  expectedParticipants: z.number().int().optional(),
  status: z.enum(["PLANNING", "ACTIVE", "COMPLETED", "CANCELLED"]).optional(),
});

export async function GET(
  _req: NextRequest,
  props: { params: Promise<{ eventId: string }> }
) {
  try {
    const params = await props.params;
    const user = await requireAuthUser();
    const ctx = await resolveCtx(user.userId, params.eventId);
    const event = await eventService.get(ctx);
    return jsonResponse(event);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(
  req: NextRequest,
  props: { params: Promise<{ eventId: string }> }
) {
  try {
    const params = await props.params;
    const user = await requireAuthUser();
    const ctx = await resolveCtx(user.userId, params.eventId);
    const body = await req.json();
    const data = updateEventSchema.parse(body);

    const updated = await eventService.update(ctx, data);
    return jsonResponse(updated);
  } catch (err) {
    return handleApiError(err);
  }
}
