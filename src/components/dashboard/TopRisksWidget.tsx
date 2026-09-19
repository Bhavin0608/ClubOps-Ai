"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { SeverityBadge } from "@/components/shared/SeverityBadge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Sparkles, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface RiskItem {
  id: string;
  severity: string;
  title: string;
  detail: string;
  aiExplanation?: any;
}

export function TopRisksWidget({
  eventId,
  risks,
  onExplainRisk,
}: {
  eventId: string;
  risks: RiskItem[];
  onExplainRisk?: (riskId: string) => void;
}) {
  return (
    <Card className="border-slate-800">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          Active Bottlenecks & Risks
        </CardTitle>
        <Link
          href={`/events/${eventId}/risks`}
          className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium"
        >
          View all <ArrowRight className="w-3 h-3" />
        </Link>
      </CardHeader>
      <CardContent className="space-y-2.5">
        {risks.length === 0 ? (
          <div className="text-center py-6 text-xs text-emerald-400 flex flex-col items-center gap-1.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span>Zero critical bottlenecks detected. Operations healthy.</span>
          </div>
        ) : (
          risks.map((r) => (
            <div
              key={r.id}
              className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="text-xs font-semibold text-white">{r.title}</div>
                  <div className="text-[11px] text-slate-400 leading-relaxed">{r.detail}</div>
                </div>
                <SeverityBadge level={r.severity} />
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-slate-800/60">
                <span className="text-[10px] text-slate-400 font-mono">
                  Engine: Deterministic Rule
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-6 px-2 text-[10px] text-blue-300 border-blue-500/30 hover:bg-blue-600/10 gap-1"
                  onClick={() => onExplainRisk?.(r.id)}
                >
                  <Sparkles className="w-2.5 h-2.5 text-blue-400" />
                  Explain with AI
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
