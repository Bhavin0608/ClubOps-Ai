import { NextRequest } from "next/server";
import { requireAuthUser, resolveCtx, jsonResponse, handleApiError, requireOrganizer } from "@/lib/api";
import { pendingActionService } from "@/server/services/pending-action.service";
import { prisma } from "@/lib/db";
import { NotFoundError } from "@/lib/errors";

export async function POST(
  _req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const user = await requireAuthUser();

    const pending = await prisma.pendingAction.findUnique({
      where: { id: params.id },
      select: { eventId: true },
    });
    if (!pending) throw new NotFoundError("Pending action not found");

    const ctx = await resolveCtx(user.userId, pending.eventId);
    requireOrganizer(ctx);

    const executed = await pendingActionService.confirm(ctx, params.id);
    return jsonResponse(executed);
  } catch (err) {
    return handleApiError(err);
  }
}
