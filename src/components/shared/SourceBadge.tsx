import React from "react";
import { Badge } from "@/components/ui/badge";
import { Sparkles, FileText, User } from "lucide-react";

export type TaskSource = "MANUAL" | "AI_GENERATED" | "MEETING_EXTRACTED";

interface SourceBadgeProps {
  source: TaskSource | string;
}

export function SourceBadge({ source }: SourceBadgeProps) {
  switch (source) {
    case "AI_GENERATED":
      return (
        <Badge
          variant="outline"
          className="bg-indigo-950/50 text-indigo-300 border-indigo-700/50 gap-1 text-[11px] font-medium"
        >
          <Sparkles className="w-3 h-3 text-indigo-400" />
          AI
        </Badge>
      );
    case "MEETING_EXTRACTED":
      return (
        <Badge
          variant="outline"
          className="bg-purple-950/50 text-purple-300 border-purple-700/50 gap-1 text-[11px] font-medium"
        >
          <FileText className="w-3 h-3 text-purple-400" />
          Meeting
        </Badge>
      );
    case "MANUAL":
    default:
      return (
        <Badge
          variant="outline"
          className="bg-slate-800/60 text-slate-400 border-slate-700/50 gap-1 text-[11px]"
        >
          <User className="w-3 h-3 text-slate-500" />
          Manual
        </Badge>
      );
  }
}
