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

    const [messages, pendingActions] = await Promise.all([
      prisma.chatMessage.findMany({
        where: { eventId: ctx.eventId, userId: ctx.userId },
        orderBy: { createdAt: "asc" },
        take: 40,
      }),
      prisma.pendingAction.findMany({
        where: { eventId: ctx.eventId, userId: ctx.userId },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    // Group pending actions by messageId
    const actionsByMsgId = new Map<string, typeof pendingActions>();
    const unlinkedPending: typeof pendingActions = [];

    for (const action of pendingActions) {
      if (action.messageId) {
        const list = actionsByMsgId.get(action.messageId) || [];
        list.push(action);
        actionsByMsgId.set(action.messageId, list);
      } else if (action.status === "PENDING") {
        unlinkedPending.push(action);
      }
    }

    // Attach actions to messages
    const enriched = messages.map((m) => {
      const staged = actionsByMsgId.get(m.id);
      return {
        ...m,
        stagedActions: staged && staged.length > 0 ? staged : undefined,
      };
    });

    // If there are unlinked actions that are still PENDING (e.g. from before messageId was recorded),
    // attach them to the last assistant message so the user can see and approve them
    if (unlinkedPending.length > 0) {
      for (let i = enriched.length - 1; i >= 0; i--) {
        if (enriched[i].role === "ASSISTANT") {
          enriched[i].stagedActions = [
            ...(enriched[i].stagedActions || []),
            ...unlinkedPending,
          ];
          break;
        }
      }
    }

    return jsonResponse(enriched);
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
