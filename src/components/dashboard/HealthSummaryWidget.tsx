"use client";

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, RefreshCw, AlertOctagon, AlertTriangle, CheckCircle2, Target } from "lucide-react";
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
      label: "CRITICAL STATUS",
      icon: AlertOctagon,
      badge: "bg-rose-950/80 text-rose-300 border-rose-800",
      glow: "glow-critical",
    },
    AT_RISK: {
      label: "AT RISK",
      icon: AlertTriangle,
      badge: "bg-amber-950/80 text-amber-300 border-amber-800",
      glow: "",
    },
    ON_TRACK: {
      label: "ON TRACK",
      icon: CheckCircle2,
      badge: "bg-emerald-950/80 text-emerald-300 border-emerald-800",
      glow: "",
    },
  }[status];

  const StatusIcon = statusConfig.icon;

  return (
    <Card className={cn("p-5 border border-slate-800 bg-gradient-to-b from-slate-900/90 to-slate-950/80", statusConfig.glow)}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400">
            <Sparkles className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">Event Health & Focus Center</h3>
              <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1", statusConfig.badge)}>
                <StatusIcon className="w-3 h-3" />
                {statusConfig.label}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Deterministic risk reconciliation with AI-synthesized mitigation priorities
            </p>
          </div>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={handleGenerateSummary}
          disabled={loading}
          className="border-slate-700 hover:bg-slate-800 text-slate-200 text-xs gap-1.5 h-8"
        >
          <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin text-blue-400")} />
          {summary ? "Refresh Analysis" : "Synthesize AI Health Insights"}
        </Button>
      </div>

      <div className="pt-4">
        {summary ? (
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-sm font-medium text-slate-200 leading-relaxed">
              {summary.headline}
            </div>

            {summary.focus && summary.focus.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {summary.focus.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 space-y-1.5 text-xs"
                  >
                    <div className="font-semibold text-white flex items-center gap-1.5">
                      <Target className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                      <span className="truncate">{item.title}</span>
                    </div>
                    <p className="text-slate-400 text-[11px] leading-relaxed">{item.why}</p>
                    <div className="pt-1 text-[11px] text-blue-300 font-medium">
                      Action: {item.suggestedAction}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="py-2 flex items-center justify-between text-xs text-slate-400">
            <span>
              Health status is deterministically evaluated as <strong className="text-slate-200">{status}</strong> based on active risks. Click the button to synthesize recommended focus areas.
            </span>
          </div>
        )}
      </div>
    </Card>
  );
}
