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
      <span className={cn("inline-flex items-center gap-1 text-xs text-[#9A8678] font-mono", className)}>
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
          "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-0.5 text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 shadow-sm",
          className
        )}
      >
        <AlertCircle className="w-3 h-3 text-rose-600" />
        <span>{text}{exact}</span>
      </span>
    );
  }

  if (isDueSoon) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-0.5 text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200",
          className
        )}
      >
        <Clock className="w-3 h-3 text-amber-600" />
        <span>{text}{exact}</span>
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-0.5 text-xs font-medium text-[#4B4038] bg-white/80 border border-[#CAAA98]/40 shadow-xs",
        className
      )}
    >
      <Clock className="w-3 h-3 text-[#9A8678]" />
      <span>{text}{exact}</span>
    </span>
  );
}
