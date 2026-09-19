import React from "react";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, Clock, Ban } from "lucide-react";

export type TaskStatus = "TODO" | "IN_PROGRESS" | "BLOCKED" | "COMPLETED";

export const ALLOWED_TASK_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  TODO: ["TODO", "IN_PROGRESS"],
  IN_PROGRESS: ["IN_PROGRESS", "BLOCKED", "COMPLETED"],
  BLOCKED: ["BLOCKED", "IN_PROGRESS"],
  COMPLETED: ["COMPLETED"],
};

interface StatusBadgeProps {
  status: TaskStatus | string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  switch (status) {
    case "COMPLETED":
      return (
        <Badge variant="success" className="gap-1 text-[11px] font-medium">
          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          Completed
        </Badge>
      );
    case "IN_PROGRESS":
      return (
        <Badge variant="default" className="gap-1 text-[11px] font-medium">
          <Clock className="w-3 h-3 text-blue-400 animate-spin" />
          In Progress
        </Badge>
      );
    case "BLOCKED":
      return (
        <Badge variant="destructive" className="gap-1 text-[11px] font-semibold">
          <Ban className="w-3 h-3 text-red-400" />
          Blocked
        </Badge>
      );
    case "TODO":
    default:
      return (
        <Badge variant="secondary" className="gap-1 text-[11px] text-slate-300">
          <Circle className="w-3 h-3 text-slate-500" />
          To Do
        </Badge>
      );
  }
}
