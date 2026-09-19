import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAuthUser, resolveCtx, jsonResponse, handleApiError } from "@/lib/api";
import { riskService } from "@/server/services/risk.service";
import { prisma } from "@/lib/db";
import { NotFoundError } from "@/lib/errors";

const updateRiskSchema = z.object({
  status: z.enum(["OPEN", "ACKNOWLEDGED", "RESOLVED"]),
});

export async function PATCH(
  req: NextRequest,
  props: { params: Promise<{ riskId: string }> }
) {
  try {
    const params = await props.params;
    const user = await requireAuthUser();

    const existing = await prisma.risk.findUnique({
      where: { id: params.riskId },
      select: { eventId: true },
    });
    if (!existing) throw new NotFoundError("Risk not found");

    const ctx = await resolveCtx(user.userId, existing.eventId);
    const body = await req.json();
    const { status } = updateRiskSchema.parse(body);

    const updated = await riskService.setStatus(ctx, params.riskId, status);
    return jsonResponse(updated);
  } catch (err) {
    return handleApiError(err);
  }
}
