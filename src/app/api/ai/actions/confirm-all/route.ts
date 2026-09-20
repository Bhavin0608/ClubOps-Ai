import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAuthUser, resolveCtx, jsonResponse, handleApiError, requireOrganizer } from "@/lib/api";
import { pendingActionService } from "@/server/services/pending-action.service";
import { prisma } from "@/lib/db";
import { ValidationError } from "@/lib/errors";

const confirmAllSchema = z.object({
  eventId: z.string().optional(),
  actionIds: z.array(z.string()).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuthUser();
    const body = await req.json().catch(() => ({}));
    const { eventId, actionIds } = confirmAllSchema.parse(body);

    let targetEventId = eventId;
    if (!targetEventId && actionIds && actionIds.length > 0) {
      const firstAction = await prisma.pendingAction.findUnique({
        where: { id: actionIds[0] },
        select: { eventId: true },
      });
      targetEventId = firstAction?.eventId;
    }

    if (!targetEventId) {
      throw new ValidationError("eventId or valid actionIds array is required");
    }

    const ctx = await resolveCtx(user.userId, targetEventId);
    requireOrganizer(ctx);

    const results = await pendingActionService.confirmAll(ctx, actionIds);
    return jsonResponse({
      success: true,
      count: results.length,
      results,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
