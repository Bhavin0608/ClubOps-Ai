import { NextRequest } from "next/server";
import { requireAuthUser, resolveCtx, jsonResponse, handleApiError } from "@/lib/api";
import { riskExplainWorkflow } from "@/server/ai/workflows/risk-explain.workflow";
import { prisma } from "@/lib/db";
import { NotFoundError } from "@/lib/errors";

export const maxDuration = 60;

export async function POST(
  _req: NextRequest,
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
    const explanation = await riskExplainWorkflow.explain(ctx, params.riskId);
    return jsonResponse(explanation);
  } catch (err) {
    return handleApiError(err);
  }
}
