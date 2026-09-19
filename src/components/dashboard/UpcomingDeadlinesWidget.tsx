import React from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { DeadlinePill } from "@/components/shared/DeadlinePill";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Clock, ArrowRight } from "lucide-react";

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
    <Card className="border-slate-800">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-400" />
          Upcoming Deadlines
        </CardTitle>
        <Link
          href={`/events/${eventId}/deadlines`}
          className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium"
        >
          View all <ArrowRight className="w-3 h-3" />
        </Link>
      </CardHeader>
      <CardContent className="space-y-2.5">
        {tasks.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-400">
            No upcoming deadlines recorded
          </div>
        ) : (
          tasks.map((t) => (
            <div
              key={t.id}
              className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-3 text-xs"
            >
              <div className="truncate flex-1">
                <div className="font-medium text-slate-200 truncate">{t.title}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  {t.owner?.name ? `${t.owner.name} (${t.owner.team || "General"})` : "Unassigned"}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
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
