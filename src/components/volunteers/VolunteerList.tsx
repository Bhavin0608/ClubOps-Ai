"use client";

import React, { useState } from "react";
import { WorkloadBar } from "@/components/shared/WorkloadBar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Users, Search, Mail, CheckCircle2, Shield, AlertCircle } from "lucide-react";

export interface MemberRow {
  id: string;
  name: string;
  email?: string | null;
  role: string;
  team?: string | null;
  skills: string[];
  availability?: string | null;
  openTasks: number;
  completedTasks: number;
  totalTasks: number;
}

interface VolunteerListProps {
  members: MemberRow[];
  onMemberUpdated?: () => void;
}

export function VolunteerList({ members }: VolunteerListProps) {
  const [search, setSearch] = useState("");
  const [teamFilter, setTeamFilter] = useState("ALL");

  const teams = Array.from(new Set(members.map((m) => m.team).filter(Boolean))) as string[];

  const filtered = members.filter((m) => {
    if (search) {
      const q = search.toLowerCase();
      const match =
        m.name.toLowerCase().includes(q) ||
        (m.email && m.email.toLowerCase().includes(q)) ||
        m.skills.some((s) => s.toLowerCase().includes(q));
      if (!match) return false;
    }
    if (teamFilter !== "ALL" && m.team !== teamFilter) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search volunteers by name, skills, email..."
            className="h-8 text-xs bg-slate-950 border-slate-700"
          />
        </div>

        {teams.length > 0 && (
          <select
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
            className="h-8 px-2 text-xs rounded-md bg-slate-950 border border-slate-700 text-slate-300 focus:outline-none"
          >
            <option value="ALL">All Teams</option>
            {teams.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Roster Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filtered.length === 0 ? (
          <div className="col-span-full text-center py-12 text-xs text-slate-400 rounded-xl border border-dashed border-slate-800">
            No volunteers match your criteria
          </div>
        ) : (
          filtered.map((m) => {
            const isOverloaded = m.openTasks >= 6;

            return (
              <div
                key={m.id}
                className={`p-4 rounded-xl border transition-all space-y-3 ${
                  isOverloaded
                    ? "bg-rose-950/20 border-rose-800/40"
                    : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-semibold text-slate-100 text-sm">{m.name}</div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-1 font-mono mt-0.5">
                      {m.email ? (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3 text-slate-500" />
                          {m.email}
                        </span>
                      ) : (
                        <span>No login linked</span>
                      )}
                    </div>
                  </div>

                  <Badge
                    variant={m.role === "ORGANIZER" ? "default" : "secondary"}
                    className="text-[10px] uppercase font-mono px-2 py-0.5"
                  >
                    {m.role}
                  </Badge>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-300">
                  <span className="text-slate-400">Team:</span>
                  <span className="font-medium text-slate-200">{m.team || "General Roster"}</span>
                </div>

                {m.skills && m.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {m.skills.map((s, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] px-1.5 py-0.2 rounded bg-slate-950 text-slate-300 border border-slate-800"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                )}

                {/* Workload Progress Bar */}
                <div className="pt-1 border-t border-slate-800/60">
                  <WorkloadBar
                    openTasks={m.openTasks}
                    completedTasks={m.completedTasks}
                    maxRecommended={6}
                    showDetails={true}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
