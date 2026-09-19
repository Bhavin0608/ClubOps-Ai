import React from "react";
import { CheckCircle2, Clock, AlertTriangle, Users, Calendar, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

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
      value: `${metrics.countdownDays} Days`,
      sub: `${metrics.expectedParticipants} Participants`,
      icon: Calendar,
      color: "text-blue-400",
      border: "border-blue-500/20",
    },
    {
      label: "Total Tasks",
      value: metrics.totalTasks,
      sub: `${completionRate}% completed (${metrics.completedTasks} done)`,
      icon: CheckCircle2,
      color: "text-emerald-400",
      border: "border-emerald-500/20",
    },
    {
      label: "Overdue Tasks",
      value: metrics.overdueTasks,
      sub: metrics.overdueTasks > 0 ? "Requires immediate action" : "All deadlines on track",
      icon: Clock,
      color: metrics.overdueTasks > 0 ? "text-rose-400" : "text-slate-400",
      border: metrics.overdueTasks > 0 ? "border-rose-500/40 bg-rose-950/20" : "border-slate-800",
    },
    {
      label: "Active Risks",
      value: metrics.openRisks,
      sub: `${metrics.activeMembers} active volunteers`,
      icon: AlertTriangle,
      color: metrics.openRisks > 0 ? "text-amber-400" : "text-emerald-400",
      border: metrics.openRisks > 0 ? "border-amber-500/30" : "border-slate-800",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((stat, i) => {
        const Icon = stat.icon;
        return (
          <Card key={i} className={`p-4 border ${stat.border}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-400">{stat.label}</span>
              <Icon className={`w-4 h-4 ${stat.color}`} />
            </div>
            <div className="text-2xl font-bold text-white tracking-tight">{stat.value}</div>
            <div className="text-[11px] text-slate-400 mt-1">{stat.sub}</div>
          </Card>
        );
      })}
    </div>
  );
}
