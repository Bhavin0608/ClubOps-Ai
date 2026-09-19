import React from "react";
import { formatRelativeDeadline, formatDisplayDate } from "@/lib/dates";
import { Clock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface DeadlinePillProps {
  deadline: Date | string | null | undefined;
  className?: string;
  showExactDate?: boolean;
}

export function DeadlinePill({ deadline, className, showExactDate = true }: DeadlinePillProps) {
  if (!deadline) {
    return (
      <span className={cn("inline-flex items-center gap-1 text-xs text-slate-500 font-mono", className)}>
        <Clock className="w-3 h-3" />
        No deadline
      </span>
    );
  }

  const { text, isOverdue, isDueSoon } = formatRelativeDeadline(deadline);
  const exact = showExactDate ? ` (${formatDisplayDate(deadline)})` : "";

  if (isOverdue) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-xs font-semibold bg-rose-950/70 text-rose-300 border border-rose-800/60 shadow-sm",
          className
        )}
      >
        <AlertCircle className="w-3 h-3 text-rose-400" />
        <span>{text}{exact}</span>
      </span>
    );
  }

  if (isDueSoon) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-xs font-medium bg-amber-950/60 text-amber-300 border border-amber-800/50",
          className
        )}
      >
        <Clock className="w-3 h-3 text-amber-400" />
        <span>{text}{exact}</span>
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-xs text-slate-300 bg-slate-800/80 border border-slate-700/60",
        className
      )}
    >
      <Clock className="w-3 h-3 text-slate-400" />
      <span>{text}{exact}</span>
    </span>
  );
}
