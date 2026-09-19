import React from "react";
import { Loader2 } from "lucide-react";

export function LoadingState({ message = "Loading operations data..." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-slate-400">
      <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-3" />
      <p className="text-sm font-medium text-slate-300">{message}</p>
      <span className="text-xs text-slate-500 mt-1">Fetching telemetry and state</span>
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="flex items-center space-x-4 py-3 animate-pulse">
      <div className="h-4 w-4 bg-slate-800 rounded" />
      <div className="space-y-2 flex-1">
        <div className="h-4 bg-slate-800 rounded w-3/4" />
        <div className="h-3 bg-slate-800/60 rounded w-1/2" />
      </div>
      <div className="h-6 w-16 bg-slate-800 rounded" />
    </div>
  );
}
