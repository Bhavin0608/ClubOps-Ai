"use client";

import React, { useState } from "react";
import { SeverityBadge } from "@/components/shared/SeverityBadge";
import { RiskExplainModal } from "./RiskExplainModal";
import { Button } from "@/components/ui/button";
import { Sparkles, Check, CheckCircle2, ShieldAlert, Eye, Loader2 } from "lucide-react";
import { toast } from "sonner";

export interface RiskRow {
  id: string;
  fingerprint: string;
  ruleKey: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: "OPEN" | "ACKNOWLEDGED" | "RESOLVED";
  title: string;
  detail: string;
  entityType?: string | null;
  evidence: Record<string, any>;
  aiExplanation?: any;
}

interface RiskListProps {
  risks: RiskRow[];
  onRiskUpdated?: () => void;
}

export function RiskList({ risks, onRiskUpdated }: RiskListProps) {
  const [selectedRisk, setSelectedRisk] = useState<RiskRow | null>(null);
  const [explainingId, setExplainingId] = useState<string | null>(null);

  const handleExplain = async (risk: RiskRow) => {
    if (risk.aiExplanation) {
      setSelectedRisk(risk);
      return;
    }

    setExplainingId(risk.id);
    try {
      const res = await fetch(`/api/risks/${risk.id}/explain`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate explanation");

      setSelectedRisk({ ...risk, aiExplanation: data });
      onRiskUpdated?.();
    } catch (err: any) {
      toast.error(err.message || "Failed to explain risk");
    } finally {
      setExplainingId(null);
    }
  };

  const handleStatusChange = async (riskId: string, newStatus: "ACKNOWLEDGED" | "RESOLVED") => {
    try {
      const res = await fetch(`/api/risks/${riskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update status");

      toast.success(`Risk status changed to ${newStatus.toLowerCase()}`);
      onRiskUpdated?.();
    } catch (err: any) {
      toast.error(err.message || "Failed to update risk");
    }
  };

  const severities = ["CRITICAL", "HIGH", "MEDIUM", "LOW"] as const;

  return (
    <div className="space-y-6">
      {severities.map((sev) => {
        const group = risks.filter((r) => r.severity === sev);
        if (group.length === 0) return null;

        return (
          <div key={sev} className="space-y-2.5">
            <div className="flex items-center gap-2">
              <SeverityBadge level={sev} />
              <span className="text-xs text-[#9A8678] font-mono font-semibold">({group.length})</span>
            </div>

            <div className="space-y-2.5">
              {group.map((r) => {
                const isAcknowledged = r.status === "ACKNOWLEDGED";
                const isExplaining = explainingId === r.id;

                return (
                  <div
                    key={r.id}
                    className="p-4 rounded-2xl bg-white/90 border border-[#CAAA98]/40 hover:border-[#CAAA98] shadow-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#202940] text-sm">{r.title}</span>
                        {isAcknowledged && (
                          <span className="text-[10px] font-mono text-[#4B4038] bg-[#FAF8F5] px-2 py-0.5 rounded-md border border-[#CAAA98]/40 font-bold">
                            ACKNOWLEDGED
                          </span>
                        )}
                      </div>
                      <p className="text-[#4B4038] leading-relaxed font-medium">{r.detail}</p>
                      <div className="text-[11px] font-mono text-[#9A8678] flex items-center gap-2 font-medium">
                        <span>Rule: {r.ruleKey}</span>
                        {r.evidence && (
                          <>
                            <span>·</span>
                            <span className="text-[#9A8678]">
                              Evidence: {JSON.stringify(r.evidence).slice(0, 80)}...
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[#CAAA98]/20">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleExplain(r)}
                        disabled={isExplaining}
                        className="text-xs text-[#202940] border-[#CAAA98]/60 hover:bg-[#CAAA98]/20 gap-1.5 h-8 font-bold"
                      >
                        {isExplaining ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-[#202940]" />
                        ) : (
                          <Sparkles className="w-3.5 h-3.5 text-[#202940]" />
                        )}
                        {r.aiExplanation ? "View AI Analysis" : "Explain with AI"}
                      </Button>

                      {!isAcknowledged && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleStatusChange(r.id, "ACKNOWLEDGED")}
                          className="text-xs text-[#4B4038] bg-[#FAF8F5] border border-[#CAAA98]/40 hover:bg-[#CAAA98]/20 h-8 gap-1 font-semibold"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#9A8678]" />
                          Ack
                        </Button>
                      )}

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusChange(r.id, "RESOLVED")}
                        className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-300 hover:bg-emerald-100 h-8 gap-1 font-bold"
                      >
                        <Check className="w-3.5 h-3.5 text-emerald-700" />
                        Resolve
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {selectedRisk && (
        <RiskExplainModal
          riskTitle={selectedRisk.title}
          explanation={selectedRisk.aiExplanation}
          onClose={() => setSelectedRisk(null)}
        />
      )}
    </div>
  );
}
