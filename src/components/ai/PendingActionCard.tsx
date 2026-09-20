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
    <div className="my-2.5 p-3.5 rounded-2xl border border-[#CAAA98]/60 bg-[#FAF8F5] shadow-xs transition-all">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-[#202940]">
          <Sparkles className="w-3.5 h-3.5 text-[#202940] animate-pulse" />
          <span>AI Action Request</span>
          <span className="text-[10px] text-[#9A8678] font-mono">({action.toolName})</span>
        </div>
        {status === "PENDING" && (
          <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-300 px-2 py-0.5 rounded-full">
            Awaiting Approval
          </span>
        )}
        {status === "EXECUTED" && (
          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-700" /> Executed
          </span>
        )}
        {status === "REJECTED" && (
          <span className="text-[10px] font-medium text-[#4B4038] bg-[#ECE5DE] border border-[#CAAA98]/40 px-2 py-0.5 rounded-full">
            Rejected
          </span>
        )}
        {status === "FAILED" && (
          <span className="text-[10px] font-bold text-rose-800 bg-rose-50 border border-rose-300 px-2 py-0.5 rounded-full flex items-center gap-1">
            <ShieldAlert className="w-3 h-3 text-rose-700" /> Failed
          </span>
        )}
      </div>

      <div className="text-sm font-semibold text-[#202940] bg-white p-2.5 rounded-xl border border-[#CAAA98]/40 mb-3 leading-relaxed shadow-xs">
        {action.summary}
      </div>

      {errorMsg && (
        <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 p-2 rounded-lg mb-3 font-medium">
          Error: {errorMsg}
        </div>
      )}

      {status === "PENDING" && (
        <div className="flex items-center gap-2 pt-1">
          <Button
            size="sm"
            variant="default"
            className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white gap-1.5 h-8 text-xs font-bold shadow-xs"
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            Confirm & Execute
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="border-[#CAAA98]/60 hover:bg-[#CAAA98]/20 text-[#4B4038] gap-1.5 h-8 text-xs font-semibold"
            onClick={handleReject}
            disabled={loading}
          >
            <X className="w-3.5 h-3.5 text-[#9A8678]" />
            Reject
          </Button>
        </div>
      )}
    </div>
  );
}
