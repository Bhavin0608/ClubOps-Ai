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
          className="bg-[#202940]/10 text-[#202940] border-[#202940]/30 gap-1 text-[11px] font-semibold"
        >
          <Sparkles className="w-3 h-3 text-[#202940]" />
          AI
        </Badge>
      );
    case "MEETING_EXTRACTED":
      return (
        <Badge
          variant="outline"
          className="bg-[#CAAA98]/25 text-[#4B4038] border-[#CAAA98]/60 gap-1 text-[11px] font-semibold"
        >
          <FileText className="w-3 h-3 text-[#4B4038]" />
          Meeting
        </Badge>
      );
    case "MANUAL":
    default:
      return (
        <Badge
          variant="outline"
          className="bg-white/80 text-[#9A8678] border-[#CAAA98]/40 gap-1 text-[11px]"
        >
          <User className="w-3 h-3 text-[#9A8678]" />
          Manual
        </Badge>
      );
  }
}
