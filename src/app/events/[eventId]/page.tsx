"use client";

import React, { useState, useEffect, use } from "react";
import { StatCards } from "@/components/dashboard/StatCards";
import { TopRisksWidget } from "@/components/dashboard/TopRisksWidget";
import { UpcomingDeadlinesWidget } from "@/components/dashboard/UpcomingDeadlinesWidget";
import { VolunteerWorkloadWidget } from "@/components/dashboard/VolunteerWorkloadWidget";
import { ActivityFeedWidget } from "@/components/dashboard/ActivityFeedWidget";
import { HealthSummaryWidget } from "@/components/dashboard/HealthSummaryWidget";
import { RiskExplainModal } from "@/components/risks/RiskExplainModal";
import { LoadingState } from "@/components/shared/LoadingState";
import { Button } from "@/components/ui/button";
import { Sparkles, Calendar, MapPin, Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { formatDisplayDate } from "@/lib/dates";

export default function EventDashboardPage(props: {
  params: Promise<{ eventId: string }>;
}) {
  const params = use(props.params);
  const eventId = params.eventId;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [selectedRisk, setSelectedRisk] = useState<any>(null);

  const fetchDashboard = () => {
    fetch(`/api/events/${eventId}/dashboard`)
      .then((res) => (res.ok ? res.json() : null))
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchDashboard();
  }, [eventId]);

  const handleExplainRisk = async (riskId: string) => {
    try {
      const res = await fetch(`/api/risks/${riskId}/explain`, { method: "POST" });
      const exp = await res.json();
      if (!res.ok) throw new Error(exp.error || "Failed to generate explanation");

      const r = data?.topRisks.find((item: any) => item.id === riskId);
      setSelectedRisk({ title: r?.title || "Risk Detail", explanation: exp });
    } catch (err: any) {
      toast.error(err.message || "Failed to explain risk");
    }
  };

  // Scene 2 demo action: Generate AI plan for newly created event
  const handleGeneratePlan = async () => {
    setGeneratingPlan(true);
    try {
      const res = await fetch("/api/ai/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId,
          instructions: "Create an initial operational plan with core teams and dependencies.",
        }),
      });

      const planData = await res.json();
      if (!res.ok) throw new Error(planData.error || "Failed to generate plan");

      toast.success("AI Plan proposed! Check the Assistant Drawer or confirm action.");
      // Confirm automatically or let user view
      const confirmRes = await fetch(`/api/ai/actions/${planData.pendingActionId}/confirm`, {
        method: "POST",
      });
      if (confirmRes.ok) {
        toast.success("Plan confirmed: 3 operational teams and tasks deployed!");
        fetchDashboard();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to generate plan");
    } finally {
      setGeneratingPlan(false);
    }
  };

  if (loading) {
    return <LoadingState message="Loading event command telemetry..." />;
  }

  const metrics = data?.metrics || {
    totalTasks: 0,
    completedTasks: 0,
    overdueTasks: 0,
    openRisks: 0,
    activeMembers: 0,
    countdownDays: 0,
    expectedParticipants: 0,
  };

  return (
    <div className="space-y-6">
      {/* Event Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-950/40 via-slate-900 to-indigo-950/30 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight">{metrics.eventName}</h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-800">
              {metrics.eventStatus}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
            {metrics.startDate && (
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                {formatDisplayDate(metrics.startDate)}
              </span>
            )}
            {metrics.venue && (
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                {metrics.venue}
              </span>
            )}
          </div>
        </div>

        {/* Scene 2 Quick Action: Propose Event Plan */}
        {metrics.totalTasks === 0 && (
          <Button
            onClick={handleGeneratePlan}
            disabled={generatingPlan}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white gap-2 text-xs font-semibold h-9 shadow-lg shadow-blue-500/25"
          >
            {generatingPlan ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating Operational Plan...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 animate-pulse" />
                Scene 2: Propose AI Plan & Tasks
              </>
            )}
          </Button>
        )}
      </div>

      {/* Health Summary Center */}
      <HealthSummaryWidget
        eventId={eventId}
        initialStatus={data?.healthStatus || "ON_TRACK"}
      />

      {/* 4 Telemetry Metric Cards */}
      <StatCards metrics={metrics} />

      {/* Dual Column Operations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Top Risks and Deadlines */}
        <div className="space-y-6">
          <TopRisksWidget
            eventId={eventId}
            risks={data?.topRisks || []}
            onExplainRisk={handleExplainRisk}
          />

          <UpcomingDeadlinesWidget
            eventId={eventId}
            tasks={data?.upcomingDeadlines || []}
          />
        </div>

        {/* Right: Volunteer Workload and Live Activity */}
        <div className="space-y-6">
          <VolunteerWorkloadWidget
            eventId={eventId}
            volunteers={data?.workload || []}
          />

          <ActivityFeedWidget logs={data?.activity || []} />
        </div>
      </div>

      {/* Explain Risk Modal */}
      {selectedRisk && (
        <RiskExplainModal
          riskTitle={selectedRisk.title}
          explanation={selectedRisk.explanation}
          onClose={() => setSelectedRisk(null)}
        />
      )}
    </div>
  );
}
