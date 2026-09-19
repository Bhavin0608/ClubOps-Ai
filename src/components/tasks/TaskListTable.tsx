"use client";

import React, { useState } from "react";
import { StatusBadge, TaskStatus, ALLOWED_TASK_TRANSITIONS } from "@/components/shared/StatusBadge";
import { SeverityBadge } from "@/components/shared/SeverityBadge";
import { SourceBadge } from "@/components/shared/SourceBadge";
import { DeadlinePill } from "@/components/shared/DeadlinePill";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, Layers, CheckCircle2, Clock } from "lucide-react";
import { toast } from "sonner";

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

interface TaskListTableProps {
  tasks: TaskRow[];
  onTaskUpdated?: () => void;
  isVolunteer?: boolean;
  currentMemberId?: string;
}

export function TaskListTable({
  tasks,
  onTaskUpdated,
  isVolunteer = false,
  currentMemberId,
}: TaskListTableProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [teamFilter, setTeamFilter] = useState<string>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL");

  const teams = Array.from(new Set(tasks.map((t) => t.team).filter(Boolean))) as string[];

  const filteredTasks = tasks.filter((t) => {
    if (search) {
      const q = search.toLowerCase();
      const match =
        t.title.toLowerCase().includes(q) ||
        (t.description && t.description.toLowerCase().includes(q)) ||
        (t.owner?.name && t.owner.name.toLowerCase().includes(q));
      if (!match) return false;
    }
    if (statusFilter !== "ALL" && t.status !== statusFilter) return false;
    if (teamFilter !== "ALL" && t.team !== teamFilter) return false;
    if (priorityFilter !== "ALL" && t.priority !== priorityFilter) return false;
    return true;
  });

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update status");
      }
      toast.success("Task status updated");
      onTaskUpdated?.();
    } catch (err: any) {
      toast.error(err.message || "Failed to update status");
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks, descriptions, owners..."
            className="h-8 text-xs bg-slate-950 border-slate-700"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-8 px-2 text-xs rounded-md bg-slate-950 border border-slate-700 text-slate-300 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="TODO">To Do</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="BLOCKED">Blocked</option>
            <option value="COMPLETED">Completed</option>
          </select>

          {/* Team filter */}
          {teams.length > 0 && (
            <select
              value={teamFilter}
              onChange={(e) => setTeamFilter(e.target.value)}
              className="h-8 px-2 text-xs rounded-md bg-slate-950 border border-slate-700 text-slate-300 focus:outline-none"
            >
              <option value="ALL">All Teams</option>
              {teams.map((team) => (
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
            className="h-8 px-2 text-xs rounded-md bg-slate-950 border border-slate-700 text-slate-300 focus:outline-none"
          >
            <option value="ALL">All Priorities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </div>

      {/* Tasks Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Task</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Priority</th>
                <th className="py-3 px-3">Owner</th>
                <th className="py-3 px-3">Deadline</th>
                <th className="py-3 px-3">Dependencies</th>
                <th className="py-3 px-3">Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">
                    No tasks match the active filters
                  </td>
                </tr>
              ) : (
                filteredTasks.map((t) => {
                  const isCompleted = t.status === "COMPLETED";
                  const canEditStatus = (!isVolunteer || t.owner?.id === currentMemberId) && !isCompleted;
                  const allowedOptions = ALLOWED_TASK_TRANSITIONS[t.status] ?? [t.status];
                  const prereqCount = t.prerequisites?.length ?? 0;
                  const dependentCount = t.dependents?.length ?? 0;

                  return (
                    <tr key={t.id} className="hover:bg-slate-900/60 transition-colors">
                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-semibold text-slate-100">{t.title}</div>
                        {t.description && (
                          <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                            {t.description}
                          </div>
                        )}
                        {t.team && (
                          <span className="inline-block mt-1 text-[10px] font-mono text-slate-400 bg-slate-950 px-1.5 py-0.2 rounded border border-slate-800">
                            {t.team}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3">
                        {canEditStatus ? (
                          <select
                            value={t.status}
                            onChange={(e) =>
                              handleStatusChange(t.id, e.target.value as TaskStatus)
                            }
                            className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded px-2 py-1 focus:outline-none cursor-pointer"
                          >
                            {allowedOptions.includes("TODO") && <option value="TODO">To Do</option>}
                            {allowedOptions.includes("IN_PROGRESS") && (
                              <option value="IN_PROGRESS">
                                {t.status === "TODO" ? "Start Task (In Progress)" : "In Progress"}
                              </option>
                            )}
                            {allowedOptions.includes("BLOCKED") && <option value="BLOCKED">Blocked</option>}
                            {allowedOptions.includes("COMPLETED") && <option value="COMPLETED">Completed</option>}
                          </select>
                        ) : (
                          <StatusBadge status={t.status} />
                        )}
                      </td>

                      <td className="py-3 px-3">
                        <SeverityBadge level={t.priority} />
                      </td>

                      <td className="py-3 px-3 font-medium">
                        {t.owner ? (
                          <div className="text-slate-200">{t.owner.name}</div>
                        ) : (
                          <span className="text-amber-400/90 text-[11px] font-mono bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-800/40">
                            Unassigned
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3">
                        <DeadlinePill deadline={t.deadline} />
                      </td>

                      <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">
                        {prereqCount > 0 || dependentCount > 0 ? (
                          <div className="flex items-center gap-1.5" title={`Waits on ${prereqCount}, blocks ${dependentCount}`}>
                            <Layers className="w-3.5 h-3.5 text-blue-400" />
                            <span>
                              {prereqCount > 0 && `←${prereqCount}`}
                              {prereqCount > 0 && dependentCount > 0 && " · "}
                              {dependentCount > 0 && `→${dependentCount}`}
                            </span>
                          </div>
                        ) : (
                          "—"
                        )}
                      </td>

                      <td className="py-3 px-3">
                        <SourceBadge source={t.source} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
