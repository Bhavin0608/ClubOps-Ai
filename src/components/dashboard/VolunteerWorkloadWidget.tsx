import React from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { WorkloadBar } from "@/components/shared/WorkloadBar";
import { Users, ArrowRight } from "lucide-react";

interface VolunteerWorkload {
  id: string;
  name: string;
  role: string;
  team: string | null;
  openTasks: number;
  completedTasks: number;
  isOverloaded: boolean;
}

export function VolunteerWorkloadWidget({
  eventId,
  volunteers,
}: {
  eventId: string;
  volunteers: VolunteerWorkload[];
}) {
  return (
    <Card className="border-slate-800">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
          <Users className="w-4 h-4 text-indigo-400" />
          Volunteer Workload & Bandwidth
        </CardTitle>
        <Link
          href={`/events/${eventId}/volunteers`}
          className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium"
        >
          View all <ArrowRight className="w-3 h-3" />
        </Link>
      </CardHeader>
      <CardContent className="space-y-3">
        {volunteers.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-400">
            No volunteers registered in roster
          </div>
        ) : (
          volunteers.slice(0, 5).map((v) => (
            <div key={v.id} className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-200">{v.name}</span>
                <span className="text-[11px] text-slate-400 font-mono">{v.team || "General"}</span>
              </div>
              <WorkloadBar
                openTasks={v.openTasks}
                completedTasks={v.completedTasks}
                maxRecommended={6}
                showDetails={true}
              />
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
