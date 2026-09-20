import React from "react";
import { Loader2 } from "lucide-react";

export function LoadingState({ message = "Loading operations data..." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-[#9A8678]">
      <Loader2 className="w-8 h-8 animate-spin text-[#202940] mb-3" />
      <p className="text-sm font-semibold text-[#4B4038]">{message}</p>
      <span className="text-xs text-[#9A8678] mt-1 font-mono">Fetching telemetry & verified state</span>
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="flex items-center space-x-4 py-3 animate-pulse">
      <div className="h-4 w-4 bg-[#CAAA98]/40 rounded" />
      <div className="space-y-2 flex-1">
        <div className="h-4 bg-[#CAAA98]/30 rounded w-3/4" />
        <div className="h-3 bg-[#CAAA98]/20 rounded w-1/2" />
      </div>
      <div className="h-6 w-16 bg-[#CAAA98]/30 rounded" />
    </div>
  );
}
