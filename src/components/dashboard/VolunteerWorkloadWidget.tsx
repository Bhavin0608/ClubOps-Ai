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
    <Card className="border-[#1c294d] bg-[#131e38]/85 shadow-lg rounded-2xl p-6">
      <CardHeader className="p-0 flex flex-row items-center justify-between pb-5 border-b border-[#1c294d]">
        <CardTitle className="text-sm font-bold text-[#f8fafc] flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#87a997]/15 border border-[#87a997]/30 flex items-center justify-center text-[#87a997]">
            <Users className="w-3.5 h-3.5 text-[#87a997]" />
          </div>
          <span>Volunteer Workload & Bandwidth</span>
        </CardTitle>
        <Link
          href={`/events/${eventId}/volunteers`}
          className="text-xs text-[#b9a8ec] hover:text-[#9b88d8] flex items-center gap-1 font-semibold transition-colors group"
        >
          <span>View all ({volunteers.length})</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </CardHeader>

      <CardContent className="p-0 pt-5 space-y-3">
        {volunteers.length === 0 ? (
          <div className="text-center py-8 px-4 rounded-xl bg-[#0b1329]/40 border border-dashed border-[#1c294d] text-xs text-[#94a3b8]">
            No volunteers registered in roster yet
          </div>
        ) : (
          volunteers.slice(0, 5).map((v) => (
            <div
              key={v.id}
              className="p-4 rounded-xl bg-[#0b1329]/70 border border-[#1c294d] hover:border-[#b9a8ec]/35 transition-all space-y-2.5 shadow-sm"
            >
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#f8fafc]">{v.name}</span>
                  <span className="text-[10px] text-[#94a3b8] font-mono bg-[#131e38] px-2 py-0.5 rounded border border-[#1c294d]">
                    {v.team || "General Operations"}
                  </span>
                </div>
                <span className="text-[11px] font-mono text-[#94a3b8] font-medium">
                  {v.role}
                </span>
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
