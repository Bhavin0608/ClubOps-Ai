"use client";

import React from "react";
import { Sparkles, X, ShieldAlert, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RiskExplainModalProps {
  riskTitle: string;
  explanation: {
    headline: string;
    impact: string[];
    recommendedActions: string[];
  } | null;
  onClose: () => void;
}

export function RiskExplainModal({
  riskTitle,
  explanation,
  onClose,
}: RiskExplainModalProps) {
  if (!explanation) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-600/20 text-blue-400">
              <Sparkles className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">AI Risk Explanation</h3>
              <p className="text-[11px] text-slate-400 truncate max-w-xs">{riskTitle}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4 text-xs">
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-sm font-semibold text-slate-200 leading-relaxed">
            {explanation.headline}
          </div>

          <div className="space-y-1.5">
            <div className="text-[11px] font-semibold text-rose-400 uppercase tracking-wider flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5" />
              Operational Impact
            </div>
            <ul className="space-y-1 text-slate-300 list-disc list-inside">
              {explanation.impact.map((imp, idx) => (
                <li key={idx} className="leading-relaxed">
                  {imp}
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-1.5">
            <div className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
              <ArrowRight className="w-3.5 h-3.5" />
              Recommended Next Actions
            </div>
            <div className="space-y-1.5">
              {explanation.recommendedActions.map((act, idx) => (
                <div
                  key={idx}
                  className="p-2 rounded bg-slate-950/60 border border-slate-800/80 text-slate-300 leading-relaxed"
                >
                  <strong className="text-blue-400">{idx + 1}.</strong> {act}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-800 flex justify-end">
          <Button size="sm" variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
