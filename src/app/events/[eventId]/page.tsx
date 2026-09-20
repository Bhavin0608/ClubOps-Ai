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
      const confirmRes = await fetch(`/api/ai/actions/${planData.pendingActionId}/confirm`, {
        method: "POST",
      });
      if (confirmRes.ok) {
        toast.success("Plan confirmed: operational teams and initial tasks deployed!");
        fetchDashboard();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to generate plan");
    } finally {
      setGeneratingPlan(false);
    }
  };

  if (loading) {
    return <LoadingState message="Restoring event command telemetry..." />;
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

  const topRisks = data?.topRisks || [];
  const upcomingDeadlines = data?.upcomingDeadlines || [];
  const workload = data?.workload || [];
  const activity = data?.activity || [];

  return (
    <div className="space-y-8 animate-portal-enter pb-12">
      {/* Serene Architectural Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-white/95 via-[#FAF8F5]/90 to-[#ECE5DE]/30 border border-[#CAAA98]/35 p-6 sm:p-8 shadow-xs backdrop-blur-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/80 shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                {metrics.eventStatus || "ACTIVE"}
              </span>
              <span className="text-[#9A8678] font-medium hidden sm:inline">•</span>
              <span className="text-[#9A8678] font-medium">
                {metrics.countdownDays > 0 ? `${metrics.countdownDays} days until commencement` : "Active cycle"}
              </span>
              <span className="text-[#9A8678] font-medium hidden sm:inline">•</span>
              <span className="font-mono text-[11px] text-[#9A8678]">
                ID: {eventId.slice(0, 8)}
              </span>
            </div>

            <div>
              <h2 className="text-2xl sm:text-3xl font-light text-[#202940] tracking-tight">
                {metrics.eventName}
              </h2>
              <p className="text-xs sm:text-sm text-[#9A8678] mt-1 font-medium max-w-2xl leading-relaxed">
                Autonomous orchestration, risk mitigation telemetry, and team harmony center.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-[#4B4038]">
              {metrics.startDate && (
                <div className="flex items-center gap-1.5 bg-white/70 px-3 py-1 rounded-xl border border-[#CAAA98]/30 font-medium">
                  <Calendar className="w-3.5 h-3.5 text-[#202940]" />
                  <span>{formatDisplayDate(metrics.startDate)}</span>
                </div>
              )}
              {metrics.venue && (
                <div className="flex items-center gap-1.5 bg-white/70 px-3 py-1 rounded-xl border border-[#CAAA98]/30 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-[#CAAA98]" />
                  <span>{metrics.venue}</span>
                </div>
              )}
              {metrics.expectedParticipants > 0 && (
                <div className="flex items-center gap-1.5 bg-white/70 px-3 py-1 rounded-xl border border-[#CAAA98]/30 font-medium">
                  <Users className="w-3.5 h-3.5 text-[#202940]" />
                  <span>{metrics.expectedParticipants} Registered Attendees</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Action Trigger for empty workspace */}
          {metrics.totalTasks === 0 && (
            <div className="flex-shrink-0">
              <Button
                onClick={handleGeneratePlan}
                disabled={generatingPlan}
                className="w-full sm:w-auto bg-[#202940] hover:bg-[#1a2133] text-white gap-2 text-xs font-semibold h-10 px-5 rounded-2xl shadow-xs cursor-pointer border-0"
              >
                {generatingPlan ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#CAAA98]" />
                    <span>Synthesizing Plan...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-[#CAAA98]" />
                    <span>Propose AI Operational Plan</span>
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Zen Floating Telemetry Deck */}
      <StatCards metrics={metrics} />

      {/* Operational Equilibrium & Focus Center */}
      <HealthSummaryWidget
        eventId={eventId}
        initialStatus={data?.healthStatus || "ON_TRACK"}
      />

      {/* Dual Column Operations Grid (Restored Directly with Spacious Breathability) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Column 1: Risks & Milestones */}
        <div className="space-y-8">
          <TopRisksWidget
            eventId={eventId}
            risks={topRisks}
            onExplainRisk={handleExplainRisk}
          />
          <UpcomingDeadlinesWidget
            eventId={eventId}
            tasks={upcomingDeadlines}
          />
        </div>

        {/* Column 2: Volunteers & Audit Trail */}
        <div className="space-y-8">
          <VolunteerWorkloadWidget
            eventId={eventId}
            volunteers={workload}
          />
          <ActivityFeedWidget logs={activity} />
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
