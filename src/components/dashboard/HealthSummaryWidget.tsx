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
      badge: "bg-rose-50 text-rose-800 border-rose-200 font-bold",
      pill: "bg-rose-600",
      glow: "",
    },
    AT_RISK: {
      label: "ELEVATED RISK LEVEL",
      sub: "Upcoming tight deadlines or unassigned high-priority deliverables require attention",
      icon: AlertTriangle,
      badge: "bg-amber-50 text-amber-800 border-amber-200 font-bold",
      pill: "bg-amber-600",
      glow: "",
    },
    ON_TRACK: {
      label: "ALL SYSTEMS NOMINAL",
      sub: "Deliverables on schedule, dependency chain clear, and volunteer load balanced",
      icon: CheckCircle2,
      badge: "bg-emerald-50 text-emerald-800 border-emerald-200 font-bold",
      pill: "bg-emerald-600",
      glow: "",
    },
  }[status];

  const StatusIcon = statusConfig.icon;

  return (
    <div className={cn("p-6 sm:p-8 rounded-3xl border border-[#CAAA98]/30 bg-white/80 shadow-xs hover:shadow-sm transition-all duration-300 backdrop-blur-xl", statusConfig.glow)}>
      {/* Widget Header Strip */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 pb-6 border-b border-[#CAAA98]/20">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-2xl bg-[#CAAA98]/15 border border-[#CAAA98]/35 flex items-center justify-center text-[#202940] flex-shrink-0 shadow-xs">
            <Sparkles className="w-5 h-5 text-[#202940]" />
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="text-base font-bold text-[#202940] tracking-tight">
                Operational Equilibrium & Focus
              </h3>
              <span className={cn("text-xs font-semibold px-3 py-1 rounded-full border flex items-center gap-1.5 shadow-xs", statusConfig.badge)}>
                <span className={cn("w-1.5 h-1.5 rounded-full", statusConfig.pill)} />
                {statusConfig.label}
              </span>
            </div>
            <p className="text-xs text-[#9A8678] max-w-2xl leading-relaxed font-medium">
              {statusConfig.sub}
            </p>
          </div>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={handleGenerateSummary}
          disabled={loading}
          className="border-[#CAAA98]/50 hover:bg-[#CAAA98]/15 text-[#202940] text-xs font-semibold gap-2 h-9 px-4 rounded-xl flex-shrink-0 cursor-pointer shadow-xs transition-all"
        >
          <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin text-[#202940]")} />
          <span>{summary ? "Re-evaluate Synthesis" : "Run AI Health Synthesis"}</span>
        </Button>
      </div>

      {/* Synthesis Content or Empty State */}
      <div className="pt-6">
        {summary ? (
          <div className="space-y-5">
            <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#CAAA98]/35 text-xs sm:text-sm font-semibold text-[#202940] leading-relaxed flex items-start gap-3 shadow-xs">
              <div className="w-2 h-2 rounded-full bg-[#202940] mt-1.5 flex-shrink-0" />
              <div className="flex-1">{summary.headline}</div>
            </div>

            {summary.focus && summary.focus.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {summary.focus.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-5 rounded-2xl bg-white/95 border border-[#CAAA98]/30 hover:border-[#CAAA98]/60 transition-all duration-300 space-y-3 text-xs flex flex-col justify-between shadow-xs hover:shadow-sm"
                  >
                    <div className="space-y-2">
                      <div className="font-bold text-[#202940] flex items-center gap-2">
                        <Target className="w-4 h-4 text-[#CAAA98] flex-shrink-0" />
                        <span className="truncate">{item.title}</span>
                      </div>
                      <p className="text-[#4B4038] text-[11px] leading-relaxed font-medium">
                        {item.why}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-[#CAAA98]/20 text-[11px] text-[#202940] font-bold flex items-center justify-between">
                      <span className="truncate">Action: {item.suggestedAction}</span>
                      <ArrowRight className="w-3.5 h-3.5 flex-shrink-0 ml-1 text-[#CAAA98]" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="py-4 px-6 rounded-2xl bg-[#FAF8F5]/80 border border-dashed border-[#CAAA98]/50 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#9A8678]">
            <span className="leading-relaxed">
              Operational balance is currently evaluated as <strong className="text-[#202940] font-bold">{status}</strong> based on live milestone telemetry. Run synthesis to receive proactive focus directives.
            </span>
            <Button
              size="sm"
              onClick={handleGenerateSummary}
              disabled={loading}
              className="bg-[#202940] hover:bg-[#1a2133] text-white font-semibold text-xs h-8 px-4 rounded-xl flex-shrink-0 cursor-pointer shadow-xs"
            >
              Synthesize Insights
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
