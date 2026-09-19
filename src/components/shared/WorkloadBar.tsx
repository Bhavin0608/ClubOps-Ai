import React from "react";
import { cn } from "@/lib/utils";
import { AlertCircle } from "lucide-react";

interface WorkloadBarProps {
  openTasks: number;
  completedTasks?: number;
  maxRecommended?: number;
  className?: string;
  showDetails?: boolean;
}

export function WorkloadBar({
  openTasks,
  completedTasks = 0,
  maxRecommended = 6,
  className,
  showDetails = true,
}: WorkloadBarProps) {
  const isOverloaded = openTasks >= maxRecommended;
  const percentage = Math.min(Math.round((openTasks / maxRecommended) * 100), 100);

  return (
    <div className={cn("space-y-1.5 w-full", className)}>
      {showDetails && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-[#94a3b8] font-mono">
            {openTasks} open {completedTasks > 0 && `· ${completedTasks} done`}
          </span>
          {isOverloaded ? (
            <span className="text-rose-400 font-semibold flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> Overloaded ({openTasks}/{maxRecommended})
            </span>
          ) : (
            <span className="text-[#94a3b8]">
              {percentage}% load
            </span>
          )}
        </div>
      )}

      <div className="h-2 w-full bg-[#0b1329] rounded-full overflow-hidden border border-[#1c294d]">
        <div
          className={cn(
            "h-full transition-all duration-300 rounded-full",
            isOverloaded
              ? "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]"
              : percentage > 70
              ? "bg-amber-500"
              : "bg-[#87a997]"
          )}
          style={{ width: `${Math.max(percentage, 5)}%` }}
        />
      </div>
    </div>
  );
}
