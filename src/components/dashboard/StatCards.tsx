import React from "react";
import { CheckCircle2, Clock, AlertTriangle, Calendar, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";

interface StatCardsProps {
  metrics: {
    totalTasks: number;
    completedTasks: number;
    overdueTasks: number;
    openRisks: number;
    activeMembers: number;
    countdownDays: number;
    expectedParticipants: number;
  };
}

export function StatCards({ metrics }: StatCardsProps) {
  const completionRate =
    metrics.totalTasks > 0
      ? Math.round((metrics.completedTasks / metrics.totalTasks) * 100)
      : 0;

  const items = [
    {
      label: "Countdown Horizon",
      value: `${metrics.countdownDays}`,
      unit: "days remaining",
      sub: `${metrics.expectedParticipants || 500} expected attendees`,
      icon: Calendar,
      statusDot: "bg-[#202940]",
    },
    {
      label: "Milestone Velocity",
      value: `${completionRate}%`,
      unit: `${metrics.completedTasks} of ${metrics.totalTasks} completed`,
      sub: `${metrics.totalTasks - metrics.completedTasks} deliverables queued`,
      icon: CheckCircle2,
      statusDot: "bg-emerald-600",
    },
    {
      label: "Schedule Integrity",
      value: `${metrics.overdueTasks}`,
      unit: metrics.overdueTasks === 1 ? "delayed deliverable" : "delayed deliverables",
      sub: metrics.overdueTasks > 0 ? "Requires resequencing" : "All deliverables on schedule",
      icon: Clock,
      statusDot: metrics.overdueTasks > 0 ? "bg-amber-600" : "bg-emerald-600",
    },
    {
      label: "Active Bottlenecks",
      value: `${metrics.openRisks}`,
      unit: metrics.openRisks === 1 ? "flagged bottleneck" : "flagged bottlenecks",
      sub: `${metrics.activeMembers || 0} active team members`,
      icon: AlertTriangle,
      statusDot: metrics.openRisks > 0 ? "bg-amber-600" : "bg-emerald-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((stat, i) => {
        const Icon = stat.icon;
        return (
          <div
            key={i}
            className="group relative p-6 rounded-3xl bg-white/75 hover:bg-white/95 border border-[#CAAA98]/30 hover:border-[#CAAA98]/60 transition-all duration-300 shadow-xs hover:shadow-md backdrop-blur-md flex flex-col justify-between"
          >
            {/* Top row: Label & Quiet Status Indicator */}
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-[#9A8678] tracking-wider uppercase">
                {stat.label}
              </span>
              <div className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${stat.statusDot}`} />
                <Icon className="w-3.5 h-3.5 text-[#9A8678] group-hover:text-[#202940] transition-colors" />
              </div>
            </div>

            {/* Core Value */}
            <div className="my-3">
              <div className="text-3xl sm:text-4xl font-light text-[#202940] tracking-tight flex items-baseline gap-2">
                <span>{stat.value}</span>
                <span className="text-xs font-medium text-[#9A8678] tracking-normal font-sans">
                  {stat.unit}
                </span>
              </div>
            </div>

            {/* Gentle Subtitle */}
            <div className="text-[11px] text-[#9A8678] font-medium pt-2 border-t border-[#CAAA98]/15 flex items-center justify-between">
              <span className="truncate">{stat.sub}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
