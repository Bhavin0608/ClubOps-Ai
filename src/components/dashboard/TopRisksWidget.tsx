"use client";

import React from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { SeverityBadge } from "@/components/shared/SeverityBadge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Sparkles, ArrowRight, CheckCircle2 } from "lucide-react";

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
    <Card className="border-[#1c294d] bg-[#131e38]/85 shadow-lg rounded-2xl p-6">
      <CardHeader className="p-0 flex flex-row items-center justify-between pb-5 border-b border-[#1c294d]">
        <CardTitle className="text-sm font-bold text-[#f8fafc] flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-amber-950/40 border border-amber-800/40 flex items-center justify-center text-amber-400">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <span>Active Bottlenecks & Operational Risks</span>
        </CardTitle>
        <Link
          href={`/events/${eventId}/risks`}
          className="text-xs text-[#b9a8ec] hover:text-[#9b88d8] flex items-center gap-1 font-semibold transition-colors group"
        >
          <span>View all ({risks.length})</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </CardHeader>

      <CardContent className="p-0 pt-5 space-y-3">
        {risks.length === 0 ? (
          <div className="text-center py-8 px-4 rounded-xl bg-[#0b1329]/40 border border-dashed border-[#1c294d] text-xs text-[#87a997] flex flex-col items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-[#87a997]/15 border border-[#87a997]/30 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-[#87a997]" />
            </div>
            <span className="font-semibold">Zero critical bottlenecks detected. Operations healthy.</span>
            <span className="text-[11px] text-[#94a3b8]">All tasks and dependencies are progressing within expected parameters.</span>
          </div>
        ) : (
          risks.map((r) => (
            <div
              key={r.id}
              className="p-4 rounded-xl bg-[#0b1329]/70 border border-[#1c294d] hover:border-[#b9a8ec]/35 transition-all space-y-2.5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 flex-1">
                  <div className="text-xs font-bold text-[#f8fafc]">{r.title}</div>
                  <div className="text-[11px] text-[#94a3b8] leading-relaxed">{r.detail}</div>
                </div>
                <SeverityBadge level={r.severity} />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#1c294d]/60">
                <span className="text-[10px] text-[#94a3b8] font-mono">
                  Engine: Deterministic Logic
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 px-2.5 text-[11px] text-[#b9a8ec] border-[#b9a8ec]/35 hover:bg-[#b9a8ec]/10 gap-1.5 rounded-lg cursor-pointer"
                  onClick={() => onExplainRisk?.(r.id)}
                >
                  <Sparkles className="w-3 h-3 text-[#b9a8ec]" />
                  <span>Explain with AI</span>
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
