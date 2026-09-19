import { NextRequest } from "next/server";
import { requireAuthUser, resolveCtx, jsonResponse, handleApiError } from "@/lib/api";
import { riskService } from "@/server/services/risk.service";

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ eventId: string }> }
) {
  try {
    const params = await props.params;
    const user = await requireAuthUser();
    const ctx = await resolveCtx(user.userId, params.eventId);

    const { searchParams } = new URL(req.url);
    if (searchParams.get("refresh") === "1") {
      await riskService.refresh(ctx);
    }

    const includeResolved = searchParams.get("includeResolved") === "true";
    const risks = await riskService.list(ctx, includeResolved);
    return jsonResponse(risks);
  } catch (err) {
    return handleApiError(err);
  }
}
