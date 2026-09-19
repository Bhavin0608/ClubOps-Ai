import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAuthUser, resolveCtx, jsonResponse, handleApiError } from "@/lib/api";
import { meetingService } from "@/server/services/meeting.service";
import { prisma } from "@/lib/db";
import { NotFoundError } from "@/lib/errors";

const updateItemSchema = z.object({
  title: z.string().min(1).optional(),
  ownerId: z.string().nullable().optional(),
  deadline: z.string().transform((s) => new Date(s)).nullable().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  status: z.enum(["PROPOSED", "APPROVED", "REJECTED"]).optional(),
});

export async function PATCH(
  req: NextRequest,
  props: { params: Promise<{ itemId: string }> }
) {
  try {
    const params = await props.params;
    const user = await requireAuthUser();

    const existing = await prisma.meetingActionItem.findUnique({
      where: { id: params.itemId },
      include: { meeting: { select: { eventId: true } } },
    });
    if (!existing) throw new NotFoundError("Action item not found");

    const ctx = await resolveCtx(user.userId, existing.meeting.eventId);
    const body = await req.json();
    const data = updateItemSchema.parse(body);

    const updated = await meetingService.updateActionItem(ctx, params.itemId, data);
    return jsonResponse(updated);
  } catch (err) {
    return handleApiError(err);
  }
}
