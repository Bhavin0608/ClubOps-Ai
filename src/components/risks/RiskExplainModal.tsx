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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#202940]/40 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-lg bg-white/95 border border-[#CAAA98]/60 rounded-2xl shadow-2xl p-6 space-y-4 backdrop-blur-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-[#CAAA98]/30">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-[#202940] text-[#CAAA98]">
              <Sparkles className="w-4 h-4 text-[#CAAA98]" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-[#202940]">AI Risk Explanation</h3>
              <p className="text-[11px] text-[#9A8678] truncate max-w-xs font-medium">{riskTitle}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-[#9A8678] hover:text-[#202940] hover:bg-[#CAAA98]/20 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4 text-xs">
          <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#CAAA98]/40 text-sm font-semibold text-[#202940] leading-relaxed shadow-xs">
            {explanation.headline}
          </div>

          <div className="space-y-1.5">
            <div className="text-[11px] font-bold text-rose-700 uppercase tracking-wider flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
              Operational Impact
            </div>
            <ul className="space-y-1 text-[#4B4038] list-disc list-inside font-medium">
              {explanation.impact.map((imp, idx) => (
                <li key={idx} className="leading-relaxed">
                  {imp}
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-1.5">
            <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
              <ArrowRight className="w-3.5 h-3.5 text-emerald-700" />
              Recommended Next Actions
            </div>
            <div className="space-y-1.5">
              {explanation.recommendedActions.map((act, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl bg-white border border-[#CAAA98]/40 text-[#4B4038] font-medium leading-relaxed shadow-xs"
                >
                  <strong className="text-[#202940] font-bold">{idx + 1}.</strong> {act}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-[#CAAA98]/30 flex justify-end">
          <Button size="sm" variant="outline" onClick={onClose} className="border-[#CAAA98]/60 hover:bg-[#CAAA98]/20 text-[#202940] font-bold">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
