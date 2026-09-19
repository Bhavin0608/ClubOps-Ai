"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, X, ShieldAlert, Loader2, Sparkles, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export interface PendingActionData {
  id: string;
  toolName: string;
  summary: string;
  status: "PENDING" | "EXECUTED" | "REJECTED" | "FAILED";
  args: any;
  result?: any;
  error?: string | null;
}

interface PendingActionCardProps {
  action: PendingActionData;
  onResolved?: (actionId: string, status: "EXECUTED" | "REJECTED") => void;
}

export function PendingActionCard({ action, onResolved }: PendingActionCardProps) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(action.status);
  const [errorMsg, setErrorMsg] = useState(action.error);

  const handleConfirm = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/ai/actions/${action.id}/confirm`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to confirm action");
      }
      setStatus("EXECUTED");
      toast.success("Action executed successfully!");
      onResolved?.(action.id, "EXECUTED");
    } catch (err: any) {
      setErrorMsg(err.message);
      setStatus("FAILED");
      toast.error(err.message || "Failed to execute action");
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/ai/actions/${action.id}/reject`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to reject action");
      }
      setStatus("REJECTED");
      toast.info("Action rejected");
      onResolved?.(action.id, "REJECTED");
    } catch (err: any) {
      setErrorMsg(err.message);
      toast.error(err.message || "Failed to reject action");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="my-2.5 p-3.5 rounded-xl border border-indigo-500/30 bg-indigo-950/20 backdrop-blur-sm shadow-md transition-all">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-300">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
          <span>AI Action Request</span>
          <span className="text-[10px] text-slate-400 font-mono">({action.toolName})</span>
        </div>
        {status === "PENDING" && (
          <span className="text-[10px] font-medium text-amber-300 bg-amber-950/60 border border-amber-800/60 px-2 py-0.5 rounded-full">
            Awaiting Approval
          </span>
        )}
        {status === "EXECUTED" && (
          <span className="text-[10px] font-medium text-emerald-300 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-full flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Executed
          </span>
        )}
        {status === "REJECTED" && (
          <span className="text-[10px] font-medium text-slate-400 bg-slate-800 border border-slate-700 px-2 py-0.5 rounded-full">
            Rejected
          </span>
        )}
        {status === "FAILED" && (
          <span className="text-[10px] font-medium text-rose-300 bg-rose-950/70 border border-rose-800/70 px-2 py-0.5 rounded-full flex items-center gap-1">
            <ShieldAlert className="w-3 h-3" /> Failed
          </span>
        )}
      </div>

      <div className="text-sm font-medium text-slate-100 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800/80 mb-3 leading-relaxed">
        {action.summary}
      </div>

      {errorMsg && (
        <div className="text-xs text-rose-300 bg-rose-950/40 border border-rose-900/60 p-2 rounded mb-3">
          Error: {errorMsg}
        </div>
      )}

      {status === "PENDING" && (
        <div className="flex items-center gap-2 pt-1">
          <Button
            size="sm"
            variant="default"
            className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white gap-1.5 h-8 text-xs font-semibold"
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            Confirm & Execute
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="border-slate-700 hover:bg-slate-800 text-slate-300 gap-1.5 h-8 text-xs"
            onClick={handleReject}
            disabled={loading}
          >
            <X className="w-3.5 h-3.5 text-slate-400" />
            Reject
          </Button>
        </div>
      )}
    </div>
  );
}
