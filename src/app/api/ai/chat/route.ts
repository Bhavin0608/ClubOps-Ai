import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAuthUser, resolveCtx, jsonResponse, handleApiError, requireOrganizer } from "@/lib/api";
import { runAssistantTurn } from "@/server/ai/agent/loop";
import { prisma } from "@/lib/db";
import { ValidationError } from "@/lib/errors";

export const maxDuration = 60;

const chatSchema = z.object({
  eventId: z.string(),
  message: z.string().min(1, "Message cannot be empty"),
});

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuthUser();
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get("eventId");
    if (!eventId) throw new ValidationError("eventId parameter is required");

    const ctx = await resolveCtx(user.userId, eventId);
    requireOrganizer(ctx);

    const messages = await prisma.chatMessage.findMany({
      where: { eventId: ctx.eventId, userId: ctx.userId },
      orderBy: { createdAt: "asc" },
      take: 40,
    });

    return jsonResponse(messages);
  } catch (err) {
    return handleApiError(err);
  }
}

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

export async function DELETE(req: NextRequest) {
  try {
    const user = await requireAuthUser();
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get("eventId");
    if (!eventId) throw new ValidationError("eventId parameter is required");

    const ctx = await resolveCtx(user.userId, eventId);
    requireOrganizer(ctx);

    await prisma.chatMessage.deleteMany({
      where: { eventId: ctx.eventId, userId: ctx.userId },
    });

    return jsonResponse({ success: true, message: "Chat history cleared" });
  } catch (err) {
    return handleApiError(err);
  }
}
