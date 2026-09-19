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
      label: "Event Countdown",
      value: `${metrics.countdownDays}`,
      unit: "Days Left",
      sub: `${metrics.expectedParticipants || 500} expected participants`,
      icon: Calendar,
      iconColor: "text-[#b9a8ec]",
      iconBg: "bg-[#b9a8ec]/15 border-[#b9a8ec]/30",
      border: "border-[#1c294d] hover:border-[#b9a8ec]/40",
      accent: "from-[#b9a8ec]/10 to-transparent",
    },
    {
      label: "Task Completion",
      value: `${completionRate}%`,
      unit: `${metrics.completedTasks}/${metrics.totalTasks} Done`,
      sub: `${metrics.totalTasks - metrics.completedTasks} deliverables pending`,
      icon: CheckCircle2,
      iconColor: "text-[#87a997]",
      iconBg: "bg-[#87a997]/15 border-[#87a997]/30",
      border: "border-[#1c294d] hover:border-[#87a997]/40",
      accent: "from-[#87a997]/10 to-transparent",
    },
    {
      label: "Overdue Deliverables",
      value: `${metrics.overdueTasks}`,
      unit: metrics.overdueTasks === 1 ? "Item Overdue" : "Items Overdue",
      sub: metrics.overdueTasks > 0 ? "Requires schedule recovery" : "All milestones on schedule",
      icon: Clock,
      iconColor: metrics.overdueTasks > 0 ? "text-rose-400" : "text-[#87a997]",
      iconBg: metrics.overdueTasks > 0 ? "bg-rose-950/40 border-rose-800/40" : "bg-[#87a997]/15 border-[#87a997]/30",
      border: metrics.overdueTasks > 0 ? "border-rose-500/40" : "border-[#1c294d]",
      accent: metrics.overdueTasks > 0 ? "from-rose-950/20 to-transparent" : "from-[#87a997]/5 to-transparent",
    },
    {
      label: "Active Risks & Capacity",
      value: `${metrics.openRisks}`,
      unit: metrics.openRisks === 1 ? "Active Risk" : "Active Risks",
      sub: `${metrics.activeMembers || 0} volunteers on duty`,
      icon: AlertTriangle,
      iconColor: metrics.openRisks > 0 ? "text-amber-400" : "text-[#87a997]",
      iconBg: metrics.openRisks > 0 ? "bg-amber-950/40 border-amber-800/40" : "bg-[#87a997]/15 border-[#87a997]/30",
      border: metrics.openRisks > 0 ? "border-amber-500/30" : "border-[#1c294d]",
      accent: metrics.openRisks > 0 ? "from-amber-950/20 to-transparent" : "from-[#87a997]/5 to-transparent",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {items.map((stat, i) => {
        const Icon = stat.icon;
        return (
          <Card
            key={i}
            className={`p-6 rounded-2xl border bg-gradient-to-b ${stat.accent} bg-[#131e38]/85 ${stat.border} transition-all hover:translate-y-[-2px] shadow-lg`}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider">
                {stat.label}
              </span>
              <div
                className={`w-9 h-9 rounded-xl border flex items-center justify-center ${stat.iconBg}`}
              >
                <Icon className={`w-4 h-4 ${stat.iconColor}`} />
              </div>
            </div>

            <div className="flex items-baseline gap-2">
              <div className="text-3xl sm:text-4xl font-extrabold text-[#f8fafc] tracking-tight">
                {stat.value}
              </div>
              <span className="text-xs font-semibold text-[#94a3b8]">
                {stat.unit}
              </span>
            </div>

            <div className="text-xs text-[#94a3b8] mt-3 pt-3 border-t border-[#1c294d]/60 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-[#94a3b8]/60 flex-shrink-0" />
              <span className="truncate">{stat.sub}</span>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
