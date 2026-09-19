import React from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { DeadlinePill } from "@/components/shared/DeadlinePill";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Clock, ArrowRight, CheckCircle2 } from "lucide-react";

interface TaskItem {
  id: string;
  title: string;
  status: string;
  deadline: string | null;
  owner?: { id: string; name: string; team?: string | null } | null;
}

export function UpcomingDeadlinesWidget({
  eventId,
  tasks,
}: {
  eventId: string;
  tasks: TaskItem[];
}) {
  return (
    <Card className="border-[#1c294d] bg-[#131e38]/85 shadow-lg rounded-2xl p-6">
      <CardHeader className="p-0 flex flex-row items-center justify-between pb-5 border-b border-[#1c294d]">
        <CardTitle className="text-sm font-bold text-[#f8fafc] flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#b9a8ec]/15 border border-[#b9a8ec]/30 flex items-center justify-center text-[#b9a8ec]">
            <Clock className="w-3.5 h-3.5 text-[#b9a8ec]" />
          </div>
          <span>Upcoming Deadlines & Milestones</span>
        </CardTitle>
        <Link
          href={`/events/${eventId}/deadlines`}
          className="text-xs text-[#b9a8ec] hover:text-[#9b88d8] flex items-center gap-1 font-semibold transition-colors group"
        >
          <span>View all ({tasks.length})</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </CardHeader>

      <CardContent className="p-0 pt-5 space-y-3">
        {tasks.length === 0 ? (
          <div className="text-center py-8 px-4 rounded-xl bg-[#0b1329]/40 border border-dashed border-[#1c294d] text-xs text-[#94a3b8] flex flex-col items-center gap-2">
            <CheckCircle2 className="w-6 h-6 text-[#87a997]" />
            <span className="font-semibold text-[#f8fafc]">No pending urgent deadlines</span>
            <span className="text-[11px] text-[#94a3b8]">All items scheduled for the next window are completed.</span>
          </div>
        ) : (
          tasks.map((t) => (
            <div
              key={t.id}
              className="p-3.5 rounded-xl bg-[#0b1329]/70 border border-[#1c294d] hover:border-[#b9a8ec]/35 transition-all flex items-center justify-between gap-4 text-xs shadow-sm"
            >
              <div className="truncate flex-1">
                <div className="font-semibold text-[#f8fafc] truncate text-xs">{t.title}</div>
                <div className="text-[11px] text-[#94a3b8] mt-1 flex items-center gap-2">
                  <span className="font-medium text-slate-300">
                    {t.owner?.name ? t.owner.name : "Unassigned"}
                  </span>
                  {t.owner?.team && (
                    <span className="font-mono text-[10px] bg-[#131e38] px-1.5 py-0.2 rounded border border-[#1c294d]">
                      {t.owner.team}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2.5 flex-shrink-0">
                <DeadlinePill deadline={t.deadline} showExactDate={false} />
                <StatusBadge status={t.status} />
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
