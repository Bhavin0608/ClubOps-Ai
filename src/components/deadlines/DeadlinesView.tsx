"use client";

import React, { useState } from "react";
import { TaskRow } from "@/components/tasks/TaskListTable";
import { DeadlinePill } from "@/components/shared/DeadlinePill";
import { StatusBadge, TaskStatus } from "@/components/shared/StatusBadge";
import { SeverityBadge } from "@/components/shared/SeverityBadge";
import { isBefore, addDays } from "date-fns";
import { AlertCircle, Calendar, Clock, HelpCircle } from "lucide-react";

interface DeadlinesViewProps {
  tasks: TaskRow[];
  onTaskUpdated?: () => void;
}

export function DeadlinesView({ tasks, onTaskUpdated }: DeadlinesViewProps) {
  const [activeTab, setActiveTab] = useState<"OVERDUE" | "WEEK" | "LATER" | "NONE">("OVERDUE");
  const now = new Date();
  const nextWeek = addDays(now, 7);

  const overdueTasks = tasks.filter(
    (t) => t.status !== "COMPLETED" && t.deadline && isBefore(new Date(t.deadline), now)
  );

  const weekTasks = tasks.filter((t) => {
    if (t.status === "COMPLETED" || !t.deadline) return false;
    const d = new Date(t.deadline);
    return !isBefore(d, now) && isBefore(d, nextWeek);
  });

  const laterTasks = tasks.filter((t) => {
    if (t.status === "COMPLETED" || !t.deadline) return false;
    const d = new Date(t.deadline);
    return !isBefore(d, nextWeek);
  });

  const noDeadlineTasks = tasks.filter((t) => !t.deadline && t.status !== "COMPLETED");

  const tabs = [
    {
      key: "OVERDUE",
      label: "Overdue",
      count: overdueTasks.length,
      icon: AlertCircle,
      color: "text-rose-400",
      list: overdueTasks,
    },
    {
      key: "WEEK",
      label: "Next 7 Days",
      count: weekTasks.length,
      icon: Clock,
      color: "text-amber-400",
      list: weekTasks,
    },
    {
      key: "LATER",
      label: "Later",
      count: laterTasks.length,
      icon: Calendar,
      color: "text-blue-400",
      list: laterTasks,
    },
    {
      key: "NONE",
      label: "No Deadline",
      count: noDeadlineTasks.length,
      icon: HelpCircle,
      color: "text-slate-400",
      list: noDeadlineTasks,
    },
  ];

  const currentTab = tabs.find((t) => t.key === activeTab)!;

  return (
    <div className="space-y-4">
      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? "bg-slate-800 text-white border border-slate-700 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${tab.color}`} />
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  isActive ? "bg-slate-950 text-slate-200" : "bg-slate-900 text-slate-400"
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Task List for current tab */}
      <div className="space-y-2.5">
        {currentTab.list.length === 0 ? (
          <div className="text-center py-12 rounded-xl border border-dashed border-slate-800 text-xs text-slate-400">
            No tasks in this category
          </div>
        ) : (
          currentTab.list.map((task) => (
            <div
              key={task.id}
              className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div className="space-y-1">
                <div className="font-semibold text-slate-100 flex items-center gap-2">
                  <span>{task.title}</span>
                  <SeverityBadge level={task.priority} showIcon={false} />
                </div>
                <div className="text-[11px] text-slate-400 flex items-center gap-2">
                  <span>Owner: {task.owner?.name ?? "Unassigned"}</span>
                  {task.team && <span>· Team: {task.team}</span>}
                </div>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
                <DeadlinePill deadline={task.deadline} />
                <StatusBadge status={task.status} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
