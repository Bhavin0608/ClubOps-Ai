import React from "react";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, AlertTriangle, Info, ShieldAlert } from "lucide-react";

export type Level = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

interface SeverityBadgeProps {
  level: Level | string;
  showIcon?: boolean;
}

export function SeverityBadge({ level, showIcon = true }: SeverityBadgeProps) {
  switch (level) {
    case "CRITICAL":
      return (
        <Badge variant="critical" className="gap-1 font-semibold text-[11px] px-2 py-0.5">
          {showIcon && <ShieldAlert className="w-3 h-3 text-rose-300" />}
          CRITICAL
        </Badge>
      );
    case "HIGH":
      return (
        <Badge variant="destructive" className="gap-1 font-medium text-[11px] px-2 py-0.5">
          {showIcon && <AlertCircle className="w-3 h-3 text-red-400" />}
          HIGH
        </Badge>
      );
    case "MEDIUM":
      return (
        <Badge variant="warning" className="gap-1 font-medium text-[11px] px-2 py-0.5">
          {showIcon && <AlertTriangle className="w-3 h-3 text-amber-400" />}
          MEDIUM
        </Badge>
      );
    case "LOW":
    default:
      return (
        <Badge variant="secondary" className="gap-1 font-normal text-[11px] px-2 py-0.5">
          {showIcon && <Info className="w-3 h-3 text-slate-400" />}
          LOW
        </Badge>
      );
  }
}
