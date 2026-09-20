"use client";

import React, { useState, useMemo } from "react";
import { StatusBadge, TaskStatus, ALLOWED_TASK_TRANSITIONS } from "@/components/shared/StatusBadge";
import { SeverityBadge } from "@/components/shared/SeverityBadge";
import { SourceBadge } from "@/components/shared/SourceBadge";
import { DeadlinePill } from "@/components/shared/DeadlinePill";
import { Input } from "@/components/ui/input";
import {
  Search,
  Layers,
  CheckSquare,
  Plus,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Play,
  ArrowRight,
  RotateCcw,
  LayoutGrid,
  Users,
  List,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  Sparkles,
  Filter,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface TaskRow {
  id: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: string;
  source: string;
  team?: string | null;
  deadline?: string | null;
  owner?: { id: string; name: string; email?: string | null; team?: string | null } | null;
  prerequisites?: { prerequisite: { id: string; title: string; status: string } }[];
  dependents?: { task: { id: string; title: string; status: string } }[];
}

export interface TaskListTableProps {
  tasks: TaskRow[];
  onTaskUpdated?: () => void;
  isVolunteer?: boolean;
  currentMemberId?: string;
  onCreateTask?: () => void;
}

type ViewMode = "PIPELINE" | "TEAMS" | "TABLE";

const PIPELINE_COLUMNS: {
  status: TaskStatus;
  label: string;
  subtitle: string;
  colorClass: string;
  borderClass: string;
  badgeClass: string;
  icon: React.ElementType;
}[] = [
  {
    status: "TODO",
    label: "To Do",
    subtitle: "Staged deliverables",
    colorClass: "text-[#4B4038]",
    borderClass: "border-[#CAAA98]/60 bg-[#FAF8F5]/80",
    badgeClass: "bg-[#CAAA98]/25 text-[#4B4038] border-[#CAAA98]/50",
    icon: Clock,
  },
  {
    status: "IN_PROGRESS",
    label: "In Progress",
    subtitle: "Active execution",
    colorClass: "text-amber-900",
    borderClass: "border-amber-400/60 bg-amber-50/40",
    badgeClass: "bg-amber-100 text-amber-900 border-amber-300",
    icon: Play,
  },
  {
    status: "BLOCKED",
    label: "Blocked",
    subtitle: "Impeded / Needs attention",
    colorClass: "text-rose-900",
    borderClass: "border-rose-400/60 bg-rose-50/40",
    badgeClass: "bg-rose-100 text-rose-900 border-rose-300",
    icon: AlertTriangle,
  },
  {
    status: "COMPLETED",
    label: "Completed",
    subtitle: "Finished & verified",
    colorClass: "text-emerald-900",
    borderClass: "border-emerald-400/60 bg-emerald-50/40",
    badgeClass: "bg-emerald-100 text-emerald-900 border-emerald-300",
    icon: CheckCircle2,
  },
];

export function TaskListTable({
  tasks,
  onTaskUpdated,
  isVolunteer = false,
  currentMemberId,
  onCreateTask,
}: TaskListTableProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [teamFilter, setTeamFilter] = useState<string>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<ViewMode>("PIPELINE");
  const [collapsedTeams, setCollapsedTeams] = useState<Record<string, boolean>>({});

  // Collect unique teams
  const allTeams = useMemo(() => {
    return Array.from(new Set(tasks.map((t) => t.team).filter(Boolean))) as string[];
  }, [tasks]);

  // Telemetry metrics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "COMPLETED").length;
  const inProgressTasks = tasks.filter((t) => t.status === "IN_PROGRESS").length;
  const todoTasks = tasks.filter((t) => t.status === "TODO").length;
  const blockedTasks = tasks.filter((t) => t.status === "BLOCKED");
  const overdueTasks = tasks.filter(
    (t) => t.status !== "COMPLETED" && t.deadline && new Date(t.deadline) < new Date()
  );
  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Filter tasks based on search & filters
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        const match =
          t.title.toLowerCase().includes(q) ||
          (t.description && t.description.toLowerCase().includes(q)) ||
          (t.owner?.name && t.owner.name.toLowerCase().includes(q)) ||
          (t.team && t.team.toLowerCase().includes(q));
        if (!match) return false;
      }
      if (statusFilter !== "ALL" && t.status !== statusFilter) return false;
      if (teamFilter !== "ALL" && t.team !== teamFilter) return false;
      if (priorityFilter !== "ALL" && t.priority !== priorityFilter) return false;
      return true;
    });
  }, [tasks, search, statusFilter, teamFilter, priorityFilter]);

  // Group tasks by team for the "TEAMS" view
  const tasksByTeam = useMemo(() => {
    const map = new Map<string, TaskRow[]>();
    // Pre-populate with all found teams
    allTeams.forEach((team) => map.set(team, []));
    map.set("Cross-Team / General", []);

    filteredTasks.forEach((t) => {
      const teamKey = t.team && t.team.trim() ? t.team.trim() : "Cross-Team / General";
      const list = map.get(teamKey) || [];
      list.push(t);
      map.set(teamKey, list);
    });

    // Remove empty teams from rendering if filtering
    return Array.from(map.entries()).filter(([_, list]) => list.length > 0);
  }, [filteredTasks, allTeams]);

  // Status transition handler
  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update task status");
      }
      toast.success(`Task marked as ${newStatus.replace("_", " ")}`);
      onTaskUpdated?.();
    } catch (err: any) {
      toast.error(err.message || "Failed to update status");
    }
  };

  const hasActiveFilters =
    search.trim() !== "" ||
    statusFilter !== "ALL" ||
    teamFilter !== "ALL" ||
    priorityFilter !== "ALL";

  const handleResetFilters = () => {
    setSearch("");
    setStatusFilter("ALL");
    setTeamFilter("ALL");
    setPriorityFilter("ALL");
  };

  const toggleTeamCollapse = (teamName: string) => {
    setCollapsedTeams((prev) => ({
      ...prev,
      [teamName]: !prev[teamName],
    }));
  };

  return (
    <div className="space-y-5">
      {/* 1. Telemetry Bar: Progress & Status Filter Chips */}
      <div className="p-4 sm:p-5 rounded-2xl glass-architectural border border-[#CAAA98]/50 shadow-sm space-y-4 backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#202940] text-white flex items-center justify-center font-bold text-xs shadow-xs">
              {completionPercentage}%
            </div>
            <div>
              <div className="text-xs font-bold text-[#202940] flex items-center gap-2">
                <span>Deliverable Progress</span>
                <span className="text-[11px] font-medium text-[#9A8678]">
                  ({completedTasks} of {totalTasks} finished)
                </span>
              </div>
              <p className="text-[11px] text-[#9A8678]">
                Real-time operational momentum across all event teams
              </p>
            </div>
          </div>

          {/* Quick metric filter pills */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => setStatusFilter("ALL")}
              className={cn(
                "px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-all cursor-pointer border",
                statusFilter === "ALL"
                  ? "bg-[#202940] text-white border-[#202940] shadow-xs"
                  : "bg-white/80 text-[#4B4038] border-[#CAAA98]/50 hover:bg-[#CAAA98]/20"
              )}
            >
              All ({totalTasks})
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter(statusFilter === "TODO" ? "ALL" : "TODO")}
              className={cn(
                "px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-all cursor-pointer border",
                statusFilter === "TODO"
                  ? "bg-[#202940] text-white border-[#202940] shadow-xs"
                  : "bg-white/80 text-[#4B4038] border-[#CAAA98]/50 hover:bg-[#CAAA98]/20"
              )}
            >
              To Do ({todoTasks})
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter(statusFilter === "IN_PROGRESS" ? "ALL" : "IN_PROGRESS")}
              className={cn(
                "px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-all cursor-pointer border",
                statusFilter === "IN_PROGRESS"
                  ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                  : "bg-amber-50/70 text-amber-900 border-amber-300 hover:bg-amber-100"
              )}
            >
              In Progress ({inProgressTasks})
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter(statusFilter === "BLOCKED" ? "ALL" : "BLOCKED")}
              className={cn(
                "px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-all cursor-pointer border flex items-center gap-1",
                statusFilter === "BLOCKED"
                  ? "bg-rose-600 text-white border-rose-600 shadow-xs"
                  : blockedTasks.length > 0
                  ? "bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100 font-bold animate-pulse"
                  : "bg-white/80 text-[#4B4038] border-[#CAAA98]/50 hover:bg-[#CAAA98]/20"
              )}
            >
              {blockedTasks.length > 0 && <AlertTriangle className="w-3 h-3 text-rose-600" />}
              Blocked ({blockedTasks.length})
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter(statusFilter === "COMPLETED" ? "ALL" : "COMPLETED")}
              className={cn(
                "px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-all cursor-pointer border",
                statusFilter === "COMPLETED"
                  ? "bg-emerald-700 text-white border-emerald-700 shadow-xs"
                  : "bg-emerald-50/70 text-emerald-900 border-emerald-300 hover:bg-emerald-100"
              )}
            >
              Done ({completedTasks})
            </button>

            {overdueTasks.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setStatusFilter("ALL");
                  // Trigger search for overdue or highlight
                  toast.warning(`${overdueTasks.length} deliverables are past their deadline`);
                }}
                className="px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all border bg-rose-100/80 text-rose-950 border-rose-300 shadow-xs flex items-center gap-1 cursor-pointer"
              >
                <Clock className="w-3 h-3 text-rose-700" />
                {overdueTasks.length} Overdue
              </button>
            )}
          </div>
        </div>

        {/* Segmented Progress Bar */}
        <div className="w-full h-2 rounded-full bg-[#CAAA98]/30 overflow-hidden flex">
          <div
            style={{ width: `${(completedTasks / (totalTasks || 1)) * 100}%` }}
            className="h-full bg-emerald-600 transition-all duration-500"
            title={`Completed: ${completedTasks}`}
          />
          <div
            style={{ width: `${(inProgressTasks / (totalTasks || 1)) * 100}%` }}
            className="h-full bg-amber-500 transition-all duration-500"
            title={`In Progress: ${inProgressTasks}`}
          />
          <div
            style={{ width: `${(blockedTasks.length / (totalTasks || 1)) * 100}%` }}
            className="h-full bg-rose-600 transition-all duration-500"
            title={`Blocked: ${blockedTasks.length}`}
          />
        </div>
      </div>

      {/* 2. Bottleneck Alert Banner (if any tasks are blocked) */}
      {blockedTasks.length > 0 && statusFilter !== "BLOCKED" && (
        <div className="p-3.5 rounded-2xl bg-rose-50/90 border border-rose-300/80 flex items-center justify-between gap-3 text-xs shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-rose-200/70 border border-rose-300 flex items-center justify-center text-rose-800 flex-shrink-0">
              <ShieldAlert className="w-4 h-4 text-rose-700" />
            </div>
            <div>
              <span className="font-bold text-rose-950">
                {blockedTasks.length} deliverable{blockedTasks.length > 1 ? "s are" : " is"} currently blocked:
              </span>{" "}
              <span className="text-rose-800/90 font-medium">
                Prerequisite bottlenecks or resource constraints require organizer intervention.
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setStatusFilter("BLOCKED")}
            className="px-3 py-1 rounded-xl bg-rose-700 hover:bg-rose-800 text-white font-bold text-[11px] whitespace-nowrap shadow-xs transition-colors cursor-pointer"
          >
            Review Blockers
          </button>
        </div>
      )}

      {/* 3. Refined Toolbar: Search, Filters & View Mode Switcher */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 p-3.5 rounded-2xl glass-architectural border border-[#CAAA98]/40 shadow-xs backdrop-blur-xl">
        {/* Search Input */}
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-[#9A8678] flex-shrink-0 ml-1" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search deliverables, owners, teams, notes..."
            className="h-9 text-xs glass-architectural-input font-medium rounded-xl focus-visible:ring-[#202940]"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="text-[11px] text-[#9A8678] hover:text-[#202940] px-1 font-bold"
            >
              Clear
            </button>
          )}
        </div>

        {/* Dropdowns & View Mode Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Team Filter */}
          {allTeams.length > 0 && (
            <select
              value={teamFilter}
              onChange={(e) => setTeamFilter(e.target.value)}
              className="h-9 px-3 text-xs rounded-xl bg-white/80 border border-[#CAAA98]/60 text-[#202940] font-semibold focus:outline-none focus:border-[#202940] transition-colors cursor-pointer"
            >
              <option value="ALL">All Teams ({allTeams.length})</option>
              {allTeams.map((team) => (
                <option key={team} value={team}>
                  {team}
                </option>
              ))}
            </select>
          )}

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="h-9 px-3 text-xs rounded-xl bg-white/80 border border-[#CAAA98]/60 text-[#202940] font-semibold focus:outline-none focus:border-[#202940] transition-colors cursor-pointer"
          >
            <option value="ALL">All Priorities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          {/* Reset Filters Pill */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="h-9 px-2.5 rounded-xl border border-[#CAAA98]/50 hover:bg-[#CAAA98]/20 text-[11px] font-bold text-[#4B4038] flex items-center gap-1 transition-colors cursor-pointer"
              title="Reset search and filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}

          {/* View Mode Toggle Switch */}
          <div className="flex items-center p-1 rounded-xl bg-[#FAF8F5] border border-[#CAAA98]/50 shadow-2xs ml-auto sm:ml-0">
            <button
              type="button"
              onClick={() => setViewMode("PIPELINE")}
              className={cn(
                "px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
                viewMode === "PIPELINE"
                  ? "bg-[#202940] text-[#FAF8F5] shadow-xs"
                  : "text-[#4B4038] hover:text-[#202940]"
              )}
              title="Pipeline Board View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Pipeline</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode("TEAMS")}
              className={cn(
                "px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
                viewMode === "TEAMS"
                  ? "bg-[#202940] text-[#FAF8F5] shadow-xs"
                  : "text-[#4B4038] hover:text-[#202940]"
              )}
              title="Group by Department / Team"
            >
              <Users className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">By Team</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode("TABLE")}
              className={cn(
                "px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
                viewMode === "TABLE"
                  ? "bg-[#202940] text-[#FAF8F5] shadow-xs"
                  : "text-[#4B4038] hover:text-[#202940]"
              )}
              title="Spreadsheet Table View"
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Table</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. Main Views: PIPELINE vs TEAMS vs TABLE */}

      {/* Empty State */}
      {filteredTasks.length === 0 && (
        <div className="p-12 text-center rounded-2xl glass-architectural border border-[#CAAA98]/40 flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#CAAA98]/20 flex items-center justify-center text-[#9A8678]">
            <CheckSquare className="w-6 h-6 text-[#9A8678]" />
          </div>
          <div>
            <h4 className="font-extrabold text-sm text-[#202940]">No deliverables found</h4>
            <p className="text-xs text-[#9A8678] max-w-sm mt-0.5">
              {hasActiveFilters
                ? "No tasks match your current query or filter selection. Try resetting filters."
                : "No operational tasks have been deployed yet for this event."}
            </p>
          </div>

          <div className="flex items-center gap-2 pt-2">
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-3 py-1.5 rounded-xl border border-[#CAAA98]/50 hover:bg-[#CAAA98]/20 text-xs font-bold text-[#4B4038] cursor-pointer"
              >
                Clear Filters
              </button>
            )}
            {onCreateTask && (
              <button
                type="button"
                onClick={onCreateTask}
                className="px-4 py-2 rounded-xl bg-[#202940] hover:bg-[#182033] text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-[#CAAA98]" />
                Create New Task
              </button>
            )}
          </div>
        </div>
      )}

      {/* VIEW 1: WORKFLOW PIPELINE (KANBAN BOARD) */}
      {filteredTasks.length > 0 && viewMode === "PIPELINE" && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
          {PIPELINE_COLUMNS.map((col) => {
            const columnTasks = filteredTasks.filter((t) => t.status === col.status);
            const IconComp = col.icon;

            return (
              <div
                key={col.status}
                className={cn(
                  "rounded-2xl border p-3.5 space-y-3 shadow-xs transition-all backdrop-blur-md flex flex-col min-h-[380px]",
                  col.borderClass
                )}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-2.5 border-b border-[#CAAA98]/30">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-white/80 border border-[#CAAA98]/40 flex items-center justify-center">
                      <IconComp className={cn("w-3.5 h-3.5", col.colorClass)} />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-xs text-[#202940] tracking-tight">
                        {col.label}
                      </h4>
                      <p className="text-[10px] text-[#9A8678] font-medium leading-none mt-0.5">
                        {col.subtitle}
                      </p>
                    </div>
                  </div>
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded-full text-[11px] font-extrabold border",
                      col.badgeClass
                    )}
                  >
                    {columnTasks.length}
                  </span>
                </div>

                {/* Cards Container */}
                <div className="space-y-3 flex-1 overflow-y-auto max-h-[70vh] pr-0.5">
                  {columnTasks.length === 0 ? (
                    <div className="h-28 flex flex-col items-center justify-center text-center p-3 rounded-xl border border-dashed border-[#CAAA98]/40 text-[#9A8678]">
                      <span className="text-[11px] font-medium">No tasks in {col.label}</span>
                    </div>
                  ) : (
                    columnTasks.map((task) => (
                      <DeliverableCard
                        key={task.id}
                        task={task}
                        isVolunteer={isVolunteer}
                        currentMemberId={currentMemberId}
                        onStatusChange={handleStatusChange}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW 2: BY TEAM / DEPARTMENT WORKFLOWS */}
      {filteredTasks.length > 0 && viewMode === "TEAMS" && (
        <div className="space-y-4">
          {tasksByTeam.map(([teamName, teamTasks]) => {
            const isCollapsed = !!collapsedTeams[teamName];
            const teamDoneCount = teamTasks.filter((t) => t.status === "COMPLETED").length;
            const teamPct = Math.round((teamDoneCount / teamTasks.length) * 100);

            // Unique owners in this team
            const uniqueOwners = Array.from(
              new Set(teamTasks.map((t) => t.owner?.name).filter(Boolean))
            );

            return (
              <div
                key={teamName}
                className="rounded-2xl border border-[#CAAA98]/50 glass-architectural shadow-xs overflow-hidden transition-all"
              >
                {/* Team Header */}
                <div
                  onClick={() => toggleTeamCollapse(teamName)}
                  className="p-4 bg-white/70 hover:bg-white/90 border-b border-[#CAAA98]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      className="p-1 text-[#9A8678] hover:text-[#202940] rounded-lg transition-colors"
                    >
                      {isCollapsed ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronUp className="w-4 h-4" />
                      )}
                    </button>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-extrabold text-sm text-[#202940]">{teamName}</h4>
                        <span className="px-2 py-0.5 rounded-full bg-[#CAAA98]/25 text-[#202940] font-bold text-[10px] border border-[#CAAA98]/40">
                          {teamTasks.length} deliverable{teamTasks.length > 1 ? "s" : ""}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#9A8678]">
                        {uniqueOwners.length > 0
                          ? `Staffed by: ${uniqueOwners.slice(0, 3).join(", ")}${
                              uniqueOwners.length > 3 ? ` +${uniqueOwners.length - 3}` : ""
                            }`
                          : "No assigned leads yet"}
                      </p>
                    </div>
                  </div>

                  {/* Team Progress Mini Indicator */}
                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    <div className="text-right">
                      <div className="text-xs font-bold text-[#202940]">
                        {teamDoneCount}/{teamTasks.length} Finished
                      </div>
                      <div className="text-[10px] text-[#9A8678] font-medium">{teamPct}% Complete</div>
                    </div>
                    <div className="w-24 h-2 rounded-full bg-[#CAAA98]/30 overflow-hidden">
                      <div
                        style={{ width: `${teamPct}%` }}
                        className="h-full bg-emerald-600 transition-all duration-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Team Task Grid */}
                {!isCollapsed && (
                  <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 bg-white/40">
                    {teamTasks.map((task) => (
                      <DeliverableCard
                        key={task.id}
                        task={task}
                        isVolunteer={isVolunteer}
                        currentMemberId={currentMemberId}
                        onStatusChange={handleStatusChange}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW 3: STRUCTURED TABLE VIEW */}
      {filteredTasks.length > 0 && viewMode === "TABLE" && (
        <div className="rounded-2xl border border-[#CAAA98]/40 bg-white/85 overflow-hidden shadow-sm backdrop-blur-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF8F5] border-b border-[#CAAA98]/30 text-[#9A8678] font-extrabold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-4 px-5">Deliverable / Task</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-4">Priority</th>
                  <th className="py-4 px-4">Assigned Owner</th>
                  <th className="py-4 px-4">Target Deadline</th>
                  <th className="py-4 px-4">Dependencies</th>
                  <th className="py-4 px-4">Provenance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#CAAA98]/20">
                {filteredTasks.map((t) => {
                  const isCompleted = t.status === "COMPLETED";
                  const canEditStatus =
                    (!isVolunteer || t.owner?.id === currentMemberId) && !isCompleted;
                  const allowedOptions = ALLOWED_TASK_TRANSITIONS[t.status] ?? [t.status];
                  const prereqCount = t.prerequisites?.length ?? 0;
                  const dependentCount = t.dependents?.length ?? 0;

                  return (
                    <tr
                      key={t.id}
                      className="hover:bg-[#CAAA98]/10 transition-colors group"
                    >
                      <td className="py-4 px-5 max-w-sm">
                        <div className="font-bold text-[#202940] group-hover:text-[#4B4038] transition-colors">
                          {t.title}
                        </div>
                        {t.description && (
                          <div className="text-[11px] text-[#4B4038] line-clamp-1 mt-0.5 font-medium">
                            {t.description}
                          </div>
                        )}
                        {t.team && (
                          <span className="inline-block mt-1 text-[10px] font-mono text-[#4B4038] bg-[#FAF8F5] px-2 py-0.5 rounded-md border border-[#CAAA98]/40">
                            {t.team}
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-4">
                        {canEditStatus ? (
                          <select
                            value={t.status}
                            onChange={(e) =>
                              handleStatusChange(t.id, e.target.value as TaskStatus)
                            }
                            className="bg-white border border-[#CAAA98]/60 text-[#202940] text-xs font-semibold rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#202940] cursor-pointer shadow-xs"
                          >
                            {allowedOptions.includes("TODO") && <option value="TODO">To Do</option>}
                            {allowedOptions.includes("IN_PROGRESS") && (
                              <option value="IN_PROGRESS">
                                {t.status === "TODO" ? "Start Task" : "In Progress"}
                              </option>
                            )}
                            {allowedOptions.includes("BLOCKED") && (
                              <option value="BLOCKED">Blocked</option>
                            )}
                            {allowedOptions.includes("COMPLETED") && (
                              <option value="COMPLETED">Completed</option>
                            )}
                          </select>
                        ) : (
                          <StatusBadge status={t.status} />
                        )}
                      </td>

                      <td className="py-4 px-4">
                        <SeverityBadge level={t.priority} />
                      </td>

                      <td className="py-4 px-4 font-medium">
                        {t.owner ? (
                          <div className="text-[#202940] font-bold">{t.owner.name}</div>
                        ) : (
                          <span className="text-amber-800 text-[11px] font-mono bg-amber-50 px-2 py-0.5 rounded-full border border-amber-300 font-bold">
                            Unassigned
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-4">
                        <DeadlinePill deadline={t.deadline} />
                      </td>

                      <td className="py-4 px-4 text-[#4B4038] font-mono text-xs">
                        {prereqCount > 0 || dependentCount > 0 ? (
                          <div
                            className="flex items-center gap-1.5 bg-[#FAF8F5] px-2 py-1 rounded-lg border border-[#CAAA98]/40 w-fit"
                            title={`Waits on ${prereqCount}, blocks ${dependentCount}`}
                          >
                            <Layers className="w-3.5 h-3.5 text-[#202940]" />
                            <span className="font-semibold text-[#202940]">
                              {prereqCount > 0 && `←${prereqCount}`}
                              {prereqCount > 0 && dependentCount > 0 && " · "}
                              {dependentCount > 0 && `→${dependentCount}`}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[#9A8678]/50">—</span>
                        )}
                      </td>

                      <td className="py-4 px-4">
                        <SourceBadge source={t.source} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Clean architectural Deliverable Card for Pipeline & Team views
 */
function DeliverableCard({
  task,
  isVolunteer,
  currentMemberId,
  onStatusChange,
}: {
  task: TaskRow;
  isVolunteer?: boolean;
  currentMemberId?: string;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
}) {
  const isCompleted = task.status === "COMPLETED";
  const canEditStatus = (!isVolunteer || task.owner?.id === currentMemberId) && !isCompleted;
  const prereqCount = task.prerequisites?.length ?? 0;
  const dependentCount = task.dependents?.length ?? 0;

  // Derive initial for owner avatar
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
        "p-3.5 rounded-2xl bg-white/95 border border-[#CAAA98]/50 shadow-xs hover:shadow-md hover:border-[#202940]/40 transition-all space-y-2.5 backdrop-blur-md group",
        isCompleted && "opacity-80 bg-white/70"
      )}
    >
      {/* Top badges: Priority + Deadline */}
      <div className="flex items-center justify-between gap-1.5">
        <SeverityBadge level={task.priority} />
        <DeadlinePill deadline={task.deadline} />
      </div>

      {/* Deliverable Title & Description */}
      <div>
        <h5
          className={cn(
            "font-extrabold text-xs text-[#202940] leading-snug line-clamp-2 transition-colors",
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

      {/* Tags & Assignee Row */}
      <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#CAAA98]/20">
        <div className="flex items-center gap-1.5 flex-wrap">
          {task.team && (
            <span className="px-2 py-0.5 rounded-md bg-[#FAF8F5] border border-[#CAAA98]/40 text-[10px] font-semibold text-[#4B4038]">
              {task.team}
            </span>
          )}

          {(prereqCount > 0 || dependentCount > 0) && (
            <span
              className="px-1.5 py-0.5 rounded-md bg-[#CAAA98]/20 text-[10px] font-mono text-[#202940] font-bold flex items-center gap-1"
              title={`Waits on ${prereqCount} task(s), blocks ${dependentCount} task(s)`}
            >
              <Layers className="w-3 h-3" />
              {prereqCount > 0 && `←${prereqCount}`}
              {dependentCount > 0 && `→${dependentCount}`}
            </span>
          )}
        </div>

        {/* Assignee Avatar */}
        {task.owner ? (
          <div
            className="flex items-center gap-1.5"
            title={`Assigned to ${task.owner.name} (${task.owner.team || "General"})`}
          >
            <div className="w-5 h-5 rounded-full bg-[#202940] text-[#FAF8F5] flex items-center justify-center text-[9px] font-bold shadow-2xs">
              {ownerInitials}
            </div>
            <span className="text-[11px] font-bold text-[#202940] max-w-[80px] truncate">
              {task.owner.name}
            </span>
          </div>
        ) : (
          <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-200">
            Unassigned
          </span>
        )}
      </div>

      {/* Quick Action Footer (Only if status is editable) */}
      {canEditStatus && (
        <div className="pt-2 flex items-center justify-between gap-1.5 border-t border-[#CAAA98]/25">
          {task.status === "TODO" && (
            <button
              type="button"
              onClick={() => onStatusChange(task.id, "IN_PROGRESS")}
              className="w-full py-1 px-2.5 rounded-xl bg-[#202940] hover:bg-[#182033] text-white text-[10.5px] font-bold transition-all flex items-center justify-center gap-1 shadow-2xs cursor-pointer"
            >
              <Play className="w-3 h-3 text-[#CAAA98]" />
              <span>Start Task</span>
            </button>
          )}

          {task.status === "IN_PROGRESS" && (
            <>
              <button
                type="button"
                onClick={() => onStatusChange(task.id, "COMPLETED")}
                className="flex-1 py-1 px-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-[10.5px] font-bold transition-all flex items-center justify-center gap-1 shadow-2xs cursor-pointer"
              >
                <CheckCircle2 className="w-3 h-3 text-emerald-200" />
                <span>Finish</span>
              </button>
              <button
                type="button"
                onClick={() => onStatusChange(task.id, "BLOCKED")}
                className="py-1 px-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 text-[10.5px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                title="Mark as blocked"
              >
                <AlertTriangle className="w-3 h-3 text-rose-600" />
                <span>Block</span>
              </button>
            </>
          )}

          {task.status === "BLOCKED" && (
            <button
              type="button"
              onClick={() => onStatusChange(task.id, "IN_PROGRESS")}
              className="w-full py-1 px-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-[10.5px] font-bold transition-all flex items-center justify-center gap-1 shadow-2xs cursor-pointer"
            >
              <RotateCcw className="w-3 h-3 text-white" />
              <span>Resolve & Resume</span>
            </button>
          )}
        </div>
      )}

      {isCompleted && (
        <div className="pt-1.5 flex items-center justify-center text-[10.5px] font-bold text-emerald-700 bg-emerald-50/50 py-1 rounded-xl border border-emerald-200/60">
          <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
          Deliverable Completed
        </div>
      )}
    </div>
  );
}

// Alias export for backward and forward compatibility
export { TaskListTable as TasksWorkflowDashboard };
