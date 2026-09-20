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
    <Card className="border-[#CAAA98]/30 bg-white/80 shadow-xs hover:shadow-sm transition-all duration-300 rounded-3xl p-6 sm:p-7 backdrop-blur-xl">
      <CardHeader className="p-0 flex flex-row items-center justify-between pb-5 border-b border-[#CAAA98]/20">
        <CardTitle className="text-sm font-bold text-[#202940] flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#202940]/10 border border-[#202940]/20 flex items-center justify-center text-[#202940] shadow-xs">
            <Users className="w-4 h-4 text-[#202940]" />
          </div>
          <span>Team Capacity & Allocation</span>
        </CardTitle>
        <Link
          href={`/events/${eventId}/volunteers`}
          className="text-xs text-[#202940] hover:text-[#9A8678] flex items-center gap-1 font-semibold transition-colors group"
        >
          <span>View all ({volunteers.length})</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform text-[#CAAA98]" />
        </Link>
      </CardHeader>

      <CardContent className="p-0 pt-5 space-y-3">
        {volunteers.length === 0 ? (
          <div className="text-center py-8 px-4 rounded-2xl bg-[#FAF8F5] border border-dashed border-[#CAAA98]/40 text-xs text-[#9A8678]">
            No team members registered in roster yet
          </div>
        ) : (
          volunteers.slice(0, 5).map((v) => (
            <div
              key={v.id}
              className="p-4 rounded-2xl bg-white/95 border border-[#CAAA98]/30 hover:border-[#CAAA98]/60 transition-all duration-300 space-y-2.5 shadow-xs"
            >
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#202940]">{v.name}</span>
                  <span className="text-[10px] text-[#4B4038] font-mono bg-[#FAF8F5] px-2 py-0.5 rounded-md border border-[#CAAA98]/35 font-medium">
                    {v.team || "Operations"}
                  </span>
                </div>
                <span className="text-[11px] font-mono text-[#9A8678] font-medium">
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
