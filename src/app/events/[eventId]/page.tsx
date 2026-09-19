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
import {
  Sparkles,
  Calendar,
  MapPin,
  Loader2,
  Activity,
  Zap,
  Users,
  AlertTriangle,
} from "lucide-react";
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
    eventName: "Event Workspace",
    eventStatus: "ACTIVE",
    totalTasks: 0,
    completedTasks: 0,
    overdueTasks: 0,
    openRisks: 0,
    activeMembers: 0,
    countdownDays: 0,
    expectedParticipants: 0,
  };

  return (
    <div className="space-y-10">
      {/* Event Hero Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#131e38] via-[#101932] to-[#0b1329] border border-[#1c294d] p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#87a997]/15 text-[#87a997] border border-[#87a997]/30">
                <span className="w-2 h-2 rounded-full bg-[#87a997] animate-pulse" />
                {metrics.eventStatus || "ACTIVE"}
              </span>
              <span className="text-xs font-mono text-[#94a3b8] bg-[#0b1329]/80 px-2.5 py-1 rounded-lg border border-[#1c294d]">
                Workspace ID: {eventId.slice(0, 8)}...
              </span>
            </div>

            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#f8fafc] tracking-tight">
                {metrics.eventName}
              </h2>
              <p className="text-xs sm:text-sm text-[#94a3b8] mt-1 max-w-2xl leading-relaxed">
                Central command dashboard for continuous risk detection, autonomous task orchestration, and team coordination.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-5 pt-1 text-xs text-[#94a3b8]">
              {metrics.startDate && (
                <div className="flex items-center gap-2 bg-[#0b1329]/60 px-3 py-1.5 rounded-lg border border-[#1c294d]">
                  <Calendar className="w-4 h-4 text-[#b9a8ec]" />
                  <span>{formatDisplayDate(metrics.startDate)}</span>
                </div>
              )}
              {metrics.venue && (
                <div className="flex items-center gap-2 bg-[#0b1329]/60 px-3 py-1.5 rounded-lg border border-[#1c294d]">
                  <MapPin className="w-4 h-4 text-[#87a997]" />
                  <span>{metrics.venue}</span>
                </div>
              )}
              {metrics.expectedParticipants > 0 && (
                <div className="flex items-center gap-2 bg-[#0b1329]/60 px-3 py-1.5 rounded-lg border border-[#1c294d]">
                  <Users className="w-4 h-4 text-[#b9a8ec]" />
                  <span>{metrics.expectedParticipants} Registered Participants</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Action Trigger */}
          {metrics.totalTasks === 0 && (
            <div className="flex-shrink-0">
              <Button
                onClick={handleGeneratePlan}
                disabled={generatingPlan}
                className="w-full sm:w-auto bg-gradient-to-r from-[#b9a8ec] via-[#ab99e4] to-[#9b88d8] hover:opacity-95 text-[#0b1329] gap-2.5 text-xs font-bold h-11 px-5 rounded-xl shadow-xl shadow-[#b9a8ec]/25 cursor-pointer border-0"
              >
                {generatingPlan ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#0b1329]" />
                    <span>Synthesizing Operational Plan...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-[#0b1329] animate-pulse" />
                    <span>Scene 2: Propose AI Plan & Tasks</span>
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Section 1: Health & Focus Center */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#b9a8ec]" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#94a3b8]">
              Operational Health & Priority Radar
            </h3>
          </div>
          <span className="text-[11px] text-[#94a3b8] hidden sm:inline">
            Deterministic rule validation + LLM mitigation synthesis
          </span>
        </div>

        <HealthSummaryWidget
          eventId={eventId}
          initialStatus={data?.healthStatus || "ON_TRACK"}
        />
      </div>

      {/* Section 2: Core Telemetry Metric Cards */}
      <div className="space-y-3.5">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-[#87a997]" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#94a3b8]">
            Key Performance Telemetry
          </h3>
        </div>

        <StatCards metrics={metrics} />
      </div>

      {/* Section 3: Dual Column Operations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Column 1: Risks & Milestones */}
        <div className="space-y-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#94a3b8]">
                Risk & Bottleneck Engine
              </h4>
            </div>
            <TopRisksWidget
              eventId={eventId}
              risks={data?.topRisks || []}
              onExplainRisk={handleExplainRisk}
            />
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#94a3b8]">
              Upcoming Deadlines & Milestones
            </h4>
            <UpcomingDeadlinesWidget
              eventId={eventId}
              tasks={data?.upcomingDeadlines || []}
            />
          </div>
        </div>

        {/* Column 2: Volunteers & Audit Feed */}
        <div className="space-y-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#87a997]" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#94a3b8]">
                Team Bandwidth & Allocation
              </h4>
            </div>
            <VolunteerWorkloadWidget
              eventId={eventId}
              volunteers={data?.workload || []}
            />
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#94a3b8]">
              Audit Trail & Autonomous Actions
            </h4>
            <ActivityFeedWidget logs={data?.activity || []} />
          </div>
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
