"use client";

import React, { useState } from "react";
import { StatusBadge, TaskStatus, ALLOWED_TASK_TRANSITIONS } from "@/components/shared/StatusBadge";
import { SeverityBadge } from "@/components/shared/SeverityBadge";
import { SourceBadge } from "@/components/shared/SourceBadge";
import { DeadlinePill } from "@/components/shared/DeadlinePill";
import { Input } from "@/components/ui/input";
import { Search, Layers, CheckSquare } from "lucide-react";
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
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update task status");
      }
      toast.success(`Task status changed to ${newStatus}`);
      onTaskUpdated?.();
    } catch (err: any) {
      toast.error(err.message || "Failed to update status");
    }
  };

  return (
    <div className="space-y-5">
      {/* Filters Toolbar Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-4 rounded-2xl bg-white/85 border border-[#CAAA98]/40 shadow-sm backdrop-blur-xl">
        <div className="flex items-center gap-2.5 flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-[#9A8678] flex-shrink-0 ml-1" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search deliverables, owners, descriptions..."
            className="h-9 text-xs bg-[#FAF8F5] border-[#CAAA98]/60 text-[#202940] rounded-xl focus-visible:ring-[#202940]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 px-3 text-xs rounded-xl bg-[#FAF8F5] border border-[#CAAA98]/60 text-[#202940] font-semibold focus:outline-none focus:border-[#202940] transition-colors cursor-pointer"
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
              className="h-9 px-3 text-xs rounded-xl bg-[#FAF8F5] border border-[#CAAA98]/60 text-[#202940] font-semibold focus:outline-none focus:border-[#202940] transition-colors cursor-pointer"
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
            className="h-9 px-3 text-xs rounded-xl bg-[#FAF8F5] border border-[#CAAA98]/60 text-[#202940] font-semibold focus:outline-none focus:border-[#202940] transition-colors cursor-pointer"
          >
            <option value="ALL">All Priorities</option>
            <option value="CRITICAL">Critical Priority</option>
            <option value="HIGH">High Priority</option>
            <option value="MEDIUM">Medium Priority</option>
            <option value="LOW">Low Priority</option>
          </select>
        </div>
      </div>

      {/* Tasks Table */}
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
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 px-4 text-[#9A8678]">
                    <div className="flex flex-col items-center gap-2">
                      <CheckSquare className="w-8 h-8 text-[#9A8678]/40" />
                      <span className="font-bold text-sm text-[#202940]">No deliverables match your filter</span>
                      <span className="text-xs text-[#9A8678]">Try resetting search filters or create a new task above</span>
                    </div>
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
                            {allowedOptions.includes("BLOCKED") && <option value="BLOCKED">Blocked</option>}
                            {allowedOptions.includes("COMPLETED") && <option value="COMPLETED">Completed</option>}
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
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
