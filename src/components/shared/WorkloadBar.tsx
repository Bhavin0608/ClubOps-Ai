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
          <span className="text-[#9A8678] font-mono font-medium">
            {openTasks} open {completedTasks > 0 && `· ${completedTasks} done`}
          </span>
          {isOverloaded ? (
            <span className="text-rose-600 font-bold flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> Overloaded ({openTasks}/{maxRecommended})
            </span>
          ) : (
            <span className="text-[#4B4038] font-medium">
              {percentage}% load
            </span>
          )}
        </div>
      )}

      <div className="h-2 w-full bg-[#ECE5DE] rounded-full overflow-hidden border border-[#CAAA98]/40">
        <div
          className={cn(
            "h-full transition-all duration-300 rounded-full",
            isOverloaded
              ? "bg-rose-500"
              : percentage > 70
              ? "bg-amber-500"
              : "bg-[#202940]"
          )}
          style={{ width: `${Math.max(percentage, 5)}%` }}
        />
      </div>
    </div>
  );
}
