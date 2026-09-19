import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAuthUser, resolveCtx, jsonResponse, handleApiError, requireOrganizer } from "@/lib/api";
import { runAssistantTurn } from "@/server/ai/agent/loop";

export const maxDuration = 60;

const chatSchema = z.object({
  eventId: z.string(),
  message: z.string().min(1, "Message cannot be empty"),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuthUser();
    const body = await req.json();
    const { eventId, message } = chatSchema.parse(body);

    const ctx = await resolveCtx(user.userId, eventId);
    requireOrganizer(ctx);

    const result = await runAssistantTurn(ctx, message);
    return jsonResponse(result);
  } catch (err) {
    return handleApiError(err);
  }
}
