import { NextRequest } from "next/server";
import { requireAuthUser, resolveCtx, jsonResponse, handleApiError, requireOrganizer } from "@/lib/api";
import { dashboardService } from "@/server/services/dashboard.service";
import { riskService } from "@/server/services/risk.service";

export async function GET(
  _req: NextRequest,
  props: { params: Promise<{ eventId: string }> }
) {
  try {
    const params = await props.params;
    const user = await requireAuthUser();
    const ctx = await resolveCtx(user.userId, params.eventId);
    requireOrganizer(ctx);

    // Refresh risks deterministically on dashboard load
    await riskService.refresh(ctx);

    const [metrics, upcomingDeadlines, workload, activity, healthStatus] = await Promise.all([
      dashboardService.metrics(ctx),
      dashboardService.upcomingDeadlines(ctx, 6),
      dashboardService.workload(ctx),
      dashboardService.recentActivity(ctx, 10),
      riskService.getHealthStatus(ctx),
    ]);

    const topRisks = await riskService.list(ctx);

    return jsonResponse({
      metrics,
      upcomingDeadlines,
      workload,
      activity,
      healthStatus,
      topRisks: topRisks.slice(0, 4),
    });
  } catch (err) {
    return handleApiError(err);
  }
}
