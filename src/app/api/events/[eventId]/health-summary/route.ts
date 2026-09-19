import { NextRequest } from "next/server";
import { requireAuthUser, resolveCtx, jsonResponse, handleApiError } from "@/lib/api";
import { healthWorkflow } from "@/server/ai/workflows/health.workflow";

export async function POST(
  _req: NextRequest,
  props: { params: Promise<{ eventId: string }> }
) {
  try {
    const params = await props.params;
    const user = await requireAuthUser();
    const ctx = await resolveCtx(user.userId, params.eventId);

    const result = await healthWorkflow.generate(ctx);
    return jsonResponse(result);
  } catch (err) {
    return handleApiError(err);
  }
}
