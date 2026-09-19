"use client";

import React, { useState, useEffect, use } from "react";
import { RiskList, RiskRow } from "@/components/risks/RiskList";
import { LoadingState } from "@/components/shared/LoadingState";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export default function RisksPage(props: {
  params: Promise<{ eventId: string }>;
}) {
  const params = use(props.params);
  const eventId = params.eventId;

  const [risks, setRisks] = useState<RiskRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRisks = (refresh = false) => {
    if (refresh) setRefreshing(true);
    fetch(`/api/events/${eventId}/risks${refresh ? "?refresh=1" : ""}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        setRisks(data);
        setLoading(false);
        setRefreshing(false);
        if (refresh) toast.success("Deterministic risk engine re-evaluated");
      })
      .catch(() => {
        setLoading(false);
        setRefreshing(false);
      });
  };

  useEffect(() => {
    fetchRisks();
  }, [eventId]);

  if (loading) return <LoadingState message="Scanning operations with risk engine..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            Operational Risk Engine & Bottlenecks
          </h2>
          <p className="text-xs text-slate-400">
            Rule-based deterministic detection with AI causal impact analysis and next actions
          </p>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={() => fetchRisks(true)}
          disabled={refreshing}
          className="border-slate-700 text-slate-300 hover:bg-slate-800 text-xs gap-1.5 h-8"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-blue-400" : ""}`} />
          Re-evaluate Risks
        </Button>
      </div>

      <RiskList risks={risks} onRiskUpdated={() => fetchRisks(false)} />
    </div>
  );
}
