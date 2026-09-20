"use client";

import React, { useState, useMemo } from "react";
import { TaskRow } from "@/components/tasks/TaskListTable";
import { DeadlinePill } from "@/components/shared/DeadlinePill";
import { StatusBadge, TaskStatus, ALLOWED_TASK_TRANSITIONS } from "@/components/shared/StatusBadge";
import { SeverityBadge } from "@/components/shared/SeverityBadge";
import { isBefore, addDays, formatDistanceToNow, format } from "date-fns";
import {
  AlertCircle,
  Calendar,
  Clock,
  HelpCircle,
  Search,
  CheckCircle2,
  CalendarClock,
  Sparkles,
  Play,
  RotateCcw,
  ShieldAlert,
  Flame,
  Milestone,
  CheckSquare,
  Plus,
  Filter,
  Layers,
  LayoutList,
  GitCommit,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatDisplayDate } from "@/lib/dates";

interface DeadlinesViewProps {
  tasks: TaskRow[];
  onTaskUpdated?: () => void;
  onCreateMilestone?: () => void;
}

type TimelineViewMode = "TIMELINE" | "BUCKETS";

export function DeadlinesView({
  tasks,
  onTaskUpdated,
  onCreateMilestone,
}: DeadlinesViewProps) {
  const [search, setSearch] = useState("");
  const [teamFilter, setTeamFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [hideCompleted, setHideCompleted] = useState(true);
  const [viewMode, setViewMode] = useState<TimelineViewMode>("TIMELINE");
  const [activeBucketKey, setActiveBucketKey] = useState<string>("OVERDUE");

  const now = new Date();
  const next48Hours = addDays(now, 2);
  const next7Days = addDays(now, 7);

  // Teams list
  const allTeams = useMemo(() => {
    return Array.from(new Set(tasks.map((t) => t.team).filter(Boolean))) as string[];
  }, [tasks]);

  // Status transition handler
  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update status");
      toast.success(`Milestone updated to ${newStatus.replace("_", " ")}`);
      onTaskUpdated?.();
    } catch (err: any) {
      toast.error(err.message || "Failed to update milestone");
    }
  };

  // Base filtered tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (hideCompleted && t.status === "COMPLETED") return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        const match =
          t.title.toLowerCase().includes(q) ||
          (t.description && t.description.toLowerCase().includes(q)) ||
          (t.owner?.name && t.owner.name.toLowerCase().includes(q)) ||
          (t.team && t.team.toLowerCase().includes(q));
        if (!match) return false;
      }

      if (teamFilter !== "ALL" && t.team !== teamFilter) return false;
      if (priorityFilter !== "ALL" && t.priority !== priorityFilter) return false;

      return true;
    });
  }, [tasks, search, teamFilter, priorityFilter, hideCompleted]);

  // Chronological Grouping
  const overdueTasks = useMemo(() => {
    return filteredTasks
      .filter((t) => t.deadline && isBefore(new Date(t.deadline), now) && t.status !== "COMPLETED")
      .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime());
  }, [filteredTasks, now]);

  const imminentTasks = useMemo(() => {
    return filteredTasks
      .filter((t) => {
        if (!t.deadline || t.status === "COMPLETED") return false;
        const d = new Date(t.deadline);
        return !isBefore(d, now) && isBefore(d, next48Hours);
      })
      .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime());
  }, [filteredTasks, now, next48Hours]);

  const weekTasks = useMemo(() => {
    return filteredTasks
      .filter((t) => {
        if (!t.deadline || t.status === "COMPLETED") return false;
        const d = new Date(t.deadline);
        return !isBefore(d, next48Hours) && isBefore(d, next7Days);
      })
      .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime());
  }, [filteredTasks, next48Hours, next7Days]);

  const laterTasks = useMemo(() => {
    return filteredTasks
      .filter((t) => {
        if (!t.deadline) return false;
        const d = new Date(t.deadline);
        return !isBefore(d, next7Days);
      })
      .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime());
  }, [filteredTasks, next7Days]);

  const noDeadlineTasks = useMemo(() => {
    return filteredTasks.filter((t) => !t.deadline);
  }, [filteredTasks]);

  // All scheduled tasks count (independent of filters for the stat cards)
  const totalWithDeadline = tasks.filter((t) => t.deadline).length;
  const totalCompleted = tasks.filter((t) => t.status === "COMPLETED").length;
  const totalOverdue = tasks.filter(
    (t) => t.status !== "COMPLETED" && t.deadline && isBefore(new Date(t.deadline), now)
  ).length;
  const totalImminent = tasks.filter((t) => {
    if (!t.deadline || t.status === "COMPLETED") return false;
    const d = new Date(t.deadline);
    return !isBefore(d, now) && isBefore(d, next48Hours);
  }).length;

  // Timeline Sections definition
  const timelineSections = [
    {
      id: "OVERDUE",
      title: "Overdue & Critical Blockers",
      subtitle: "Deadlines elapsed — immediate resolution required",
      items: overdueTasks,
      badgeColor: "bg-rose-100 text-rose-900 border-rose-300",
      iconColor: "text-rose-600",
      dotColor: "bg-rose-600 ring-rose-300",
      icon: ShieldAlert,
      urgent: true,
    },
    {
      id: "IMMINENT",
      title: "Next 48 Hours Checkpoints",
      subtitle: "Imminent deliverables requiring immediate preparation",
      items: imminentTasks,
      badgeColor: "bg-amber-100 text-amber-900 border-amber-300",
      iconColor: "text-amber-600",
      dotColor: "bg-amber-500 ring-amber-200",
      icon: Flame,
      urgent: false,
    },
    {
      id: "WEEK",
      title: "This Week (Next 7 Days)",
      subtitle: "Active operational workstream milestones",
      items: weekTasks,
      badgeColor: "bg-[#CAAA98]/30 text-[#202940] border-[#CAAA98]/60",
      iconColor: "text-[#202940]",
      dotColor: "bg-[#202940] ring-[#CAAA98]/40",
      icon: CalendarClock,
      urgent: false,
    },
    {
      id: "LATER",
      title: "Future Milestones",
      subtitle: "Scheduled deliverables beyond the 7-day window",
      items: laterTasks,
      badgeColor: "bg-[#FAF8F5] text-[#4B4038] border-[#CAAA98]/40",
      iconColor: "text-[#9A8678]",
      dotColor: "bg-[#9A8678] ring-[#CAAA98]/30",
      icon: Milestone,
      urgent: false,
    },
    {
      id: "NONE",
      title: "Unscheduled Deliverables",
      subtitle: "Work items pending timeline & date commitment",
      items: noDeadlineTasks,
      badgeColor: "bg-white text-[#9A8678] border-[#CAAA98]/40",
      iconColor: "text-[#9A8678]",
      dotColor: "bg-[#CAAA98] ring-transparent",
      icon: HelpCircle,
      urgent: false,
    },
  ];

  const bucketTabs = [
    { key: "OVERDUE", label: "Overdue", count: overdueTasks.length, icon: AlertCircle, color: "text-rose-600" },
    { key: "IMMINENT", label: "Next 48h", count: imminentTasks.length, icon: Flame, color: "text-amber-600" },
    { key: "WEEK", label: "7 Days", count: weekTasks.length, icon: CalendarClock, color: "text-[#202940]" },
    { key: "LATER", label: "Later", count: laterTasks.length, icon: Milestone, color: "text-[#9A8678]" },
    { key: "NONE", label: "Unscheduled", count: noDeadlineTasks.length, icon: HelpCircle, color: "text-[#9A8678]" },
  ];

  const activeBucket = timelineSections.find((s) => s.id === activeBucketKey)!;

  return (
    <div className="space-y-6">
      {/* 1. Telemetry Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Overdue Card */}
        <div
          onClick={() => {
            setViewMode("BUCKETS");
            setActiveBucketKey("OVERDUE");
          }}
          className={cn(
            "p-4 rounded-2xl border transition-all cursor-pointer shadow-xs group",
            totalOverdue > 0
              ? "bg-rose-50/80 border-rose-300/80 hover:border-rose-400"
              : "glass-architectural border-[#CAAA98]/40 hover:border-[#CAAA98]"
          )}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-[#4B4038] uppercase tracking-wider">
              Overdue
            </span>
            <div
              className={cn(
                "w-7 h-7 rounded-xl flex items-center justify-center",
                totalOverdue > 0 ? "bg-rose-200/80 text-rose-800" : "bg-[#CAAA98]/20 text-[#9A8678]"
              )}
            >
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span
              className={cn(
                "text-2xl font-black",
                totalOverdue > 0 ? "text-rose-700" : "text-[#202940]"
              )}
            >
              {totalOverdue}
            </span>
            <span className="text-[11px] text-[#9A8678] font-medium">
              {totalOverdue > 0 ? "requires immediate action" : "all on schedule"}
            </span>
          </div>
        </div>

        {/* Next 48 Hours */}
        <div
          onClick={() => {
            setViewMode("BUCKETS");
            setActiveBucketKey("IMMINENT");
          }}
          className="p-4 rounded-2xl glass-architectural border border-[#CAAA98]/40 hover:border-[#CAAA98] transition-all cursor-pointer shadow-xs group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-[#4B4038] uppercase tracking-wider">
              Next 48 Hours
            </span>
            <div className="w-7 h-7 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <Flame className="w-4 h-4 text-amber-700" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#202940]">{totalImminent}</span>
            <span className="text-[11px] text-[#9A8678] font-medium">imminent deliverables</span>
          </div>
        </div>

        {/* 7-Day Velocity */}
        <div
          onClick={() => {
            setViewMode("BUCKETS");
            setActiveBucketKey("WEEK");
          }}
          className="p-4 rounded-2xl glass-architectural border border-[#CAAA98]/40 hover:border-[#CAAA98] transition-all cursor-pointer shadow-xs group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-[#4B4038] uppercase tracking-wider">
              Next 7 Days
            </span>
            <div className="w-7 h-7 rounded-xl bg-[#202940] text-white flex items-center justify-center">
              <CalendarClock className="w-4 h-4 text-[#CAAA98]" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#202940]">{weekTasks.length}</span>
            <span className="text-[11px] text-[#9A8678] font-medium">critical milestones</span>
          </div>
        </div>

        {/* Scheduled Ratio */}
        <div className="p-4 rounded-2xl glass-architectural border border-[#CAAA98]/40 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-[#4B4038] uppercase tracking-wider">
              Scheduled Rate
            </span>
            <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <CheckSquare className="w-4 h-4 text-emerald-700" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#202940]">
              {tasks.length > 0 ? Math.round((totalWithDeadline / tasks.length) * 100) : 0}%
            </span>
            <span className="text-[11px] text-[#9A8678] font-medium">
              {totalWithDeadline} of {tasks.length} timed
            </span>
          </div>
        </div>
      </div>

      {/* 2. Control Toolbar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 p-3.5 rounded-2xl glass-architectural border border-[#CAAA98]/40 shadow-xs">
        {/* Search */}
        <div className="flex items-center gap-2 flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-[#9A8678] ml-1" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search deadlines, milestones, owners..."
            className="w-full h-9 px-3 text-xs glass-architectural-input rounded-xl font-medium"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="text-[11px] text-[#9A8678] hover:text-[#202940] font-bold px-1"
            >
              Clear
            </button>
          )}
        </div>

        {/* Filters and View Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Team filter */}
          {allTeams.length > 0 && (
            <select
              value={teamFilter}
              onChange={(e) => setTeamFilter(e.target.value)}
              className="h-9 px-3 text-xs rounded-xl bg-white/80 border border-[#CAAA98]/60 text-[#202940] font-semibold focus:outline-none focus:border-[#202940] cursor-pointer"
            >
              <option value="ALL">All Teams</option>
              {allTeams.map((team) => (
                <option key={team} value={team}>
                  {team}
                </option>
              ))}
            </select>
          )}

          {/* Priority filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="h-9 px-3 text-xs rounded-xl bg-white/80 border border-[#CAAA98]/60 text-[#202940] font-semibold focus:outline-none focus:border-[#202940] cursor-pointer"
          >
            <option value="ALL">All Priorities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          {/* Hide Completed Toggle */}
          <label className="flex items-center gap-1.5 px-3 h-9 rounded-xl bg-white/80 border border-[#CAAA98]/50 text-xs font-semibold text-[#4B4038] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={hideCompleted}
              onChange={(e) => setHideCompleted(e.target.checked)}
              className="w-3.5 h-3.5 rounded text-[#202940] accent-[#202940]"
            />
            <span>Hide Done</span>
          </label>

          {/* View Mode Toggle Switch */}
          <div className="flex items-center p-1 rounded-xl bg-[#FAF8F5] border border-[#CAAA98]/50 shadow-2xs ml-auto sm:ml-0">
            <button
              type="button"
              onClick={() => setViewMode("TIMELINE")}
              className={cn(
                "px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
                viewMode === "TIMELINE"
                  ? "bg-[#202940] text-[#FAF8F5] shadow-xs"
                  : "text-[#4B4038] hover:text-[#202940]"
              )}
            >
              <GitCommit className="w-3.5 h-3.5" />
              <span>Milestone Timeline</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode("BUCKETS")}
              className={cn(
                "px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
                viewMode === "BUCKETS"
                  ? "bg-[#202940] text-[#FAF8F5] shadow-xs"
                  : "text-[#4B4038] hover:text-[#202940]"
              )}
            >
              <LayoutList className="w-3.5 h-3.5" />
              <span>Category Tabs</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Empty State when nothing matches */}
      {filteredTasks.length === 0 && (
        <div className="p-12 text-center rounded-2xl glass-architectural border border-[#CAAA98]/40 flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#CAAA98]/20 flex items-center justify-center text-[#9A8678]">
            <CalendarClock className="w-6 h-6 text-[#9A8678]" />
          </div>
          <div>
            <h4 className="font-extrabold text-sm text-[#202940]">No scheduled milestones found</h4>
            <p className="text-xs text-[#9A8678] max-w-sm mt-0.5">
              {search || teamFilter !== "ALL" || priorityFilter !== "ALL"
                ? "No items match your active filters. Try clearing search filters."
                : "No operational deadlines have been configured for this event."}
            </p>
          </div>
          {onCreateMilestone && (
            <button
              type="button"
              onClick={onCreateMilestone}
              className="mt-2 px-4 py-2 rounded-xl bg-[#202940] hover:bg-[#182033] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-[#CAAA98]" />
              Schedule New Milestone
            </button>
          )}
        </div>
      )}

      {/* 4. VIEW MODE A: CHRONOLOGICAL MILESTONE TIMELINE */}
      {filteredTasks.length > 0 && viewMode === "TIMELINE" && (
        <div className="space-y-7 relative pl-4 sm:pl-6 before:absolute before:left-3 sm:before:left-5 before:top-4 before:bottom-4 before:w-[2px] before:bg-gradient-to-b before:from-[#CAAA98] before:via-[#CAAA98]/50 before:to-transparent">
          {timelineSections.map((sec) => {
            if (sec.items.length === 0) return null;
            const IconComponent = sec.icon;

            return (
              <div key={sec.id} className="relative space-y-3.5">
                {/* Timeline node & Section Header */}
                <div className="flex items-center gap-3">
                  {/* Outer glowing pulse ring node on the rail */}
                  <div
                    className={cn(
                      "relative -left-[23px] sm:-left-[27px] w-5 h-5 rounded-full border-2 border-white ring-4 flex items-center justify-center shadow-xs flex-shrink-0 z-10",
                      sec.dotColor
                    )}
                  />

                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="font-extrabold text-sm text-[#202940] flex items-center gap-2">
                      <IconComponent className={cn("w-4 h-4", sec.iconColor)} />
                      {sec.title}
                    </h4>
                    <span
                      className={cn(
                        "px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border shadow-2xs",
                        sec.badgeColor
                      )}
                    >
                      {sec.items.length} {sec.items.length > 1 ? "deliverables" : "deliverable"}
                    </span>
                    <span className="text-[11px] text-[#9A8678] font-medium hidden sm:inline">
                      • {sec.subtitle}
                    </span>
                  </div>
                </div>

                {/* Milestones Cards Grid in this section */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5 pl-2">
                  {sec.items.map((task) => (
                    <MilestoneCard
                      key={task.id}
                      task={task}
                      onStatusChange={handleStatusChange}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. VIEW MODE B: CATEGORY TABS (POLISHED BUCKETS VIEW) */}
      {filteredTasks.length > 0 && viewMode === "BUCKETS" && (
        <div className="space-y-4">
          {/* Tabs Bar */}
          <div className="flex flex-wrap gap-2 border-b border-[#CAAA98]/30 pb-3">
            {bucketTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeBucketKey === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveBucketKey(tab.key)}
                  className={cn(
                    "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border",
                    isActive
                      ? "bg-[#202940] text-white border-[#202940] shadow-xs"
                      : "bg-white/80 text-[#4B4038] hover:bg-[#CAAA98]/20 border-[#CAAA98]/40"
                  )}
                >
                  <Icon className={cn("w-3.5 h-3.5", isActive ? "text-[#CAAA98]" : tab.color)} />
                  <span>{tab.label}</span>
                  <span
                    className={cn(
                      "px-1.5 py-0.5 rounded-full text-[10px] font-mono",
                      isActive
                        ? "bg-[#CAAA98] text-[#202940] font-extrabold"
                        : "bg-[#ECE5DE] text-[#4B4038] font-bold"
                    )}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Task Grid for Active Tab */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
            {activeBucket.items.length === 0 ? (
              <div className="col-span-full text-center py-12 rounded-2xl border border-dashed border-[#CAAA98]/60 bg-white/60 text-xs text-[#9A8678] font-medium">
                No deliverables in this schedule category
              </div>
            ) : (
              activeBucket.items.map((task) => (
                <MilestoneCard
                  key={task.id}
                  task={task}
                  onStatusChange={handleStatusChange}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Architectural Milestone Card with urgency indicator & quick actions
 */
function MilestoneCard({
  task,
  onStatusChange,
}: {
  task: TaskRow;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
}) {
  const isCompleted = task.status === "COMPLETED";
  const isKeyMilestone = task.priority === "CRITICAL" || task.priority === "HIGH";

  // Initials
  const ownerInitials = task.owner?.name
    ? task.owner.name
        .split(" ")
        .map((p) => p[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : null;

  return (
    <div
      className={cn(
        "p-4 rounded-2xl bg-white/95 border border-[#CAAA98]/50 shadow-xs hover:shadow-md hover:border-[#202940]/40 transition-all space-y-3 backdrop-blur-md group flex flex-col justify-between",
        isCompleted && "opacity-75 bg-white/70"
      )}
    >
      <div className="space-y-2.5">
        {/* Top Header: Priority Badge + Key Milestone Tag + Deadline Pill */}
        <div className="flex items-center justify-between gap-1.5 flex-wrap">
          <div className="flex items-center gap-1.5">
            <SeverityBadge level={task.priority} showIcon={false} />
            {isKeyMilestone && (
              <span className="px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-extrabold flex items-center gap-1 shadow-2xs">
                <Sparkles className="w-2.5 h-2.5 text-amber-700" />
                Key Milestone
              </span>
            )}
          </div>
          <DeadlinePill deadline={task.deadline} />
        </div>

        {/* Deliverable Title & Description */}
        <div>
          <h5
            className={cn(
              "font-extrabold text-xs text-[#202940] leading-snug line-clamp-2",
              isCompleted && "line-through text-[#9A8678]"
            )}
          >
            {task.title}
          </h5>
          {task.description && (
            <p className="text-[11px] text-[#4B4038]/80 font-medium line-clamp-2 mt-1">
              {task.description}
            </p>
          )}
        </div>

        {/* Exact Target Date Display */}
        {task.deadline && (
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#4B4038] bg-[#FAF8F5] px-2.5 py-1 rounded-xl border border-[#CAAA98]/30">
            <Calendar className="w-3.5 h-3.5 text-[#9A8678]" />
            <span>Target: {formatDisplayDate(task.deadline)}</span>
          </div>
        )}
      </div>

      {/* Footer: Team + Assignee + Inline Status Changer */}
      <div className="pt-2 border-t border-[#CAAA98]/20 space-y-2">
        <div className="flex items-center justify-between gap-2">
          {/* Team Tag */}
          {task.team ? (
            <span className="px-2 py-0.5 rounded-md bg-[#FAF8F5] border border-[#CAAA98]/40 text-[10px] font-bold text-[#4B4038]">
              {task.team}
            </span>
          ) : (
            <span className="text-[10px] text-[#9A8678]">Cross-Team</span>
          )}

          {/* Owner Avatar / Chip */}
          {task.owner ? (
            <div className="flex items-center gap-1.5" title={task.owner.name}>
              <div className="w-5 h-5 rounded-full bg-[#202940] text-[#FAF8F5] flex items-center justify-center text-[9px] font-bold">
                {ownerInitials}
              </div>
              <span className="text-[11px] font-bold text-[#202940] max-w-[85px] truncate">
                {task.owner.name}
              </span>
            </div>
          ) : (
            <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-200">
              Unassigned
            </span>
          )}
        </div>

        {/* Quick Status Advancement */}
        {!isCompleted ? (
          <div className="flex items-center justify-between gap-1.5 pt-1">
            {task.status === "TODO" && (
              <button
                type="button"
                onClick={() => onStatusChange(task.id, "IN_PROGRESS")}
                className="w-full py-1 px-2.5 rounded-xl bg-[#202940] hover:bg-[#182033] text-white text-[10.5px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
              >
                <Play className="w-3 h-3 text-[#CAAA98]" />
                <span>Start Milestone</span>
              </button>
            )}

            {task.status === "IN_PROGRESS" && (
              <button
                type="button"
                onClick={() => onStatusChange(task.id, "COMPLETED")}
                className="w-full py-1 px-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-[10.5px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
              >
                <CheckCircle2 className="w-3 h-3 text-emerald-200" />
                <span>Mark Delivered</span>
              </button>
            )}

            {task.status === "BLOCKED" && (
              <button
                type="button"
                onClick={() => onStatusChange(task.id, "IN_PROGRESS")}
                className="w-full py-1 px-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-[10.5px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3 text-white" />
                <span>Resolve Blocker</span>
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center text-[10.5px] font-bold text-emerald-700 bg-emerald-50/70 py-1 rounded-xl border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
            Milestone Achieved
          </div>
        )}
      </div>
    </div>
  );
}
