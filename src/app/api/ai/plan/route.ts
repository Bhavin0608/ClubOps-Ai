import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAuthUser, resolveCtx, jsonResponse, handleApiError, requireOrganizer } from "@/lib/api";
import { planWorkflow } from "@/server/ai/workflows/plan.workflow";

export const maxDuration = 60;

const planSchema = z.object({
  eventId: z.string(),
  instructions: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuthUser();
    const body = await req.json();
    const { eventId, instructions } = planSchema.parse(body);

    const ctx = await resolveCtx(user.userId, eventId);
    requireOrganizer(ctx);

    const result = await planWorkflow.generate(ctx, instructions);
    return jsonResponse(result);
  } catch (err) {
    return handleApiError(err);
  }
}
