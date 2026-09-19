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
              <span className="text-xs text-slate-400 font-mono">({group.length})</span>
            </div>

            <div className="space-y-2">
              {group.map((r) => {
                const isAcknowledged = r.status === "ACKNOWLEDGED";
                const isExplaining = explainingId === r.id;

                return (
                  <div
                    key={r.id}
                    className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-100 text-sm">{r.title}</span>
                        {isAcknowledged && (
                          <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.2 rounded border border-slate-700">
                            ACKNOWLEDGED
                          </span>
                        )}
                      </div>
                      <p className="text-slate-300 leading-relaxed">{r.detail}</p>
                      <div className="text-[11px] font-mono text-slate-400 flex items-center gap-2">
                        <span>Rule: {r.ruleKey}</span>
                        {r.evidence && (
                          <>
                            <span>·</span>
                            <span className="text-slate-400">
                              Evidence: {JSON.stringify(r.evidence).slice(0, 80)}...
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleExplain(r)}
                        disabled={isExplaining}
                        className="text-xs text-blue-300 border-blue-500/40 hover:bg-blue-600/10 gap-1.5 h-8 font-medium"
                      >
                        {isExplaining ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
                        ) : (
                          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                        )}
                        {r.aiExplanation ? "View AI Analysis" : "Explain with AI"}
                      </Button>

                      {!isAcknowledged && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleStatusChange(r.id, "ACKNOWLEDGED")}
                          className="text-xs text-slate-300 h-8 gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Ack
                        </Button>
                      )}

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusChange(r.id, "RESOLVED")}
                        className="text-xs text-emerald-400 border-emerald-500/30 hover:bg-emerald-600/10 h-8 gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
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
