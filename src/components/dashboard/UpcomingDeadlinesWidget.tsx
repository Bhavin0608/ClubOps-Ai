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
    <Card className="border-[#CAAA98]/30 bg-white/80 shadow-xs hover:shadow-sm transition-all duration-300 rounded-3xl p-6 sm:p-7 backdrop-blur-xl">
      <CardHeader className="p-0 flex flex-row items-center justify-between pb-5 border-b border-[#CAAA98]/20">
        <CardTitle className="text-sm font-bold text-[#202940] flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#CAAA98]/15 border border-[#CAAA98]/35 flex items-center justify-center text-[#202940] shadow-xs">
            <Clock className="w-4 h-4 text-[#202940]" />
          </div>
          <span>Upcoming Deadlines & Milestones</span>
        </CardTitle>
        <Link
          href={`/events/${eventId}/deadlines`}
          className="text-xs text-[#202940] hover:text-[#9A8678] flex items-center gap-1 font-semibold transition-colors group"
        >
          <span>View all ({tasks.length})</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform text-[#CAAA98]" />
        </Link>
      </CardHeader>

      <CardContent className="p-0 pt-5 space-y-3">
        {tasks.length === 0 ? (
          <div className="text-center py-8 px-4 rounded-2xl bg-[#FAF8F5] border border-dashed border-[#CAAA98]/40 text-xs text-[#4B4038] flex flex-col items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <span className="font-bold text-[#202940]">No pending urgent deadlines</span>
            <span className="text-[11px] text-[#9A8678]">All deliverables scheduled for the active cycle are complete.</span>
          </div>
        ) : (
          tasks.map((t) => (
            <div
              key={t.id}
              className="p-4 rounded-2xl bg-white/95 border border-[#CAAA98]/30 hover:border-[#CAAA98]/60 transition-all duration-300 flex items-center justify-between gap-4 text-xs shadow-xs"
            >
              <div className="truncate flex-1">
                <div className="font-bold text-[#202940] truncate text-xs">{t.title}</div>
                <div className="text-[11px] text-[#9A8678] mt-1 flex items-center gap-2">
                  <span className="font-semibold text-[#4B4038]">
                    {t.owner?.name ? t.owner.name : "Unassigned"}
                  </span>
                  {t.owner?.team && (
                    <span className="font-mono text-[10px] bg-[#FAF8F5] px-2 py-0.5 rounded-md border border-[#CAAA98]/35 text-[#4B4038]">
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
