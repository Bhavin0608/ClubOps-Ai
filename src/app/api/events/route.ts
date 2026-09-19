import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAuthUser, jsonResponse, handleApiError } from "@/lib/api";
import { eventService } from "@/server/services/event.service";

const createEventSchema = z.object({
  name: z.string().min(2, "Event name must be at least 2 characters"),
  description: z.string().optional(),
  startDate: z.string().transform((str) => new Date(str)),
  endDate: z.string().transform((str) => new Date(str)),
  venue: z.string().optional(),
  expectedParticipants: z.number().int().positive().optional(),
});

export async function GET() {
  try {
    const user = await requireAuthUser();
    const events = await eventService.listForUser(user.userId);
    return jsonResponse(events);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuthUser();
    const body = await req.json();
    const data = createEventSchema.parse(body);

    const result = await eventService.create(user.userId, data);
    return jsonResponse(result, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
