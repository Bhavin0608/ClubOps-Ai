"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, RefreshCw, AlertOctagon, AlertTriangle, CheckCircle2, Target, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface HealthSummaryData {
  headline: string;
  focus: {
    title: string;
    why: string;
    suggestedAction: string;
    taskIds: string[];
  }[];
}

export function HealthSummaryWidget({
  eventId,
  initialStatus,
}: {
  eventId: string;
  initialStatus: "CRITICAL" | "AT_RISK" | "ON_TRACK";
}) {
  const [status, setStatus] = useState(initialStatus);
  const [summary, setSummary] = useState<HealthSummaryData | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerateSummary = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/events/${eventId}/health-summary`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate health summary");

      setStatus(data.status);
      setSummary(data.summary);
      toast.success("Health analysis refreshed!");
    } catch (err: any) {
      toast.error(err.message || "Could not generate health summary");
    } finally {
      setLoading(false);
    }
  };

  const statusConfig = {
    CRITICAL: {
      label: "CRITICAL RISK DETECTED",
      sub: "Blocking dependencies or severe volunteer burnout requires immediate action",
      icon: AlertOctagon,
      badge: "bg-rose-950/80 text-rose-300 border-rose-800",
      pill: "bg-rose-500",
      glow: "glow-critical",
    },
    AT_RISK: {
      label: "ELEVATED RISK LEVEL",
      sub: "Upcoming tight deadlines or unassigned high-priority deliverables require attention",
      icon: AlertTriangle,
      badge: "bg-amber-950/80 text-amber-300 border-amber-800",
      pill: "bg-amber-500",
      glow: "",
    },
    ON_TRACK: {
      label: "ALL SYSTEMS NOMINAL",
      sub: "Deliverables on schedule, dependency chain clear, and volunteer load balanced",
      icon: CheckCircle2,
      badge: "bg-[#87a997]/15 text-[#87a997] border-[#87a997]/30",
      pill: "bg-[#87a997]",
      glow: "glow-sage",
    },
  }[status];

  const StatusIcon = statusConfig.icon;

  return (
    <Card className={cn("p-6 sm:p-7 rounded-2xl border border-[#1c294d] bg-[#131e38]/85 shadow-xl backdrop-blur-md", statusConfig.glow)}>
      {/* Widget Header Strip */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 pb-6 border-b border-[#1c294d]">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#b9a8ec]/15 border border-[#b9a8ec]/30 flex items-center justify-center text-[#b9a8ec] flex-shrink-0 shadow-inner">
            <Sparkles className="w-6 h-6 text-[#b9a8ec]" />
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="text-base font-bold text-[#f8fafc] tracking-tight">
                Event Health & Autonomous Focus Center
              </h3>
              <span className={cn("text-xs font-semibold px-3 py-1 rounded-full border flex items-center gap-1.5", statusConfig.badge)}>
                <StatusIcon className="w-3.5 h-3.5" />
                {statusConfig.label}
              </span>
            </div>
            <p className="text-xs text-[#94a3b8] max-w-2xl leading-relaxed">
              {statusConfig.sub}
            </p>
          </div>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={handleGenerateSummary}
          disabled={loading}
          className="border-[#1c294d] hover:bg-[#1c294d] text-slate-200 text-xs gap-2 h-9 px-4 rounded-xl flex-shrink-0 cursor-pointer"
        >
          <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin text-[#b9a8ec]")} />
          <span>{summary ? "Refresh AI Synthesis" : "Run AI Health Synthesis"}</span>
        </Button>
      </div>

      {/* Synthesis Content or Empty State */}
      <div className="pt-6">
        {summary ? (
          <div className="space-y-5">
            <div className="p-4 rounded-xl bg-[#0b1329]/90 border border-[#1c294d] text-sm font-medium text-[#f8fafc] leading-relaxed flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-[#b9a8ec] mt-2 flex-shrink-0" />
              <div className="flex-1">{summary.headline}</div>
            </div>

            {summary.focus && summary.focus.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {summary.focus.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-[#0b1329]/70 border border-[#1c294d] hover:border-[#b9a8ec]/40 transition-all space-y-2.5 text-xs flex flex-col justify-between"
                  >
                    <div className="space-y-1.5">
                      <div className="font-bold text-[#f8fafc] flex items-center gap-2">
                        <Target className="w-4 h-4 text-[#b9a8ec] flex-shrink-0" />
                        <span className="truncate">{item.title}</span>
                      </div>
                      <p className="text-[#94a3b8] text-[11px] leading-relaxed">
                        {item.why}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-[#1c294d]/70 text-[11px] text-[#b9a8ec] font-semibold flex items-center justify-between">
                      <span className="truncate">Action: {item.suggestedAction}</span>
                      <ArrowRight className="w-3.5 h-3.5 flex-shrink-0 ml-1 opacity-75" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="py-4 px-5 rounded-xl bg-[#0b1329]/50 border border-dashed border-[#1c294d] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#94a3b8]">
            <span>
              Health status is currently evaluated as <strong className="text-[#f8fafc]">{status}</strong> based on live risk telemetry. Run AI synthesis to generate real-time mitigation suggestions.
            </span>
            <Button
              size="sm"
              onClick={handleGenerateSummary}
              disabled={loading}
              className="bg-[#b9a8ec] hover:bg-[#9b88d8] text-[#0b1329] font-semibold text-xs h-8 px-3 rounded-lg flex-shrink-0 cursor-pointer"
            >
              Synthesize Insights
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
