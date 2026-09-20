"use client";

import React, { useState, useMemo } from "react";
import { WorkloadBar } from "@/components/shared/WorkloadBar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Users,
  Search,
  Mail,
  CheckCircle2,
  Shield,
  AlertCircle,
  Clock,
  Layers,
  Sparkles,
  LayoutGrid,
  Users2,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  Copy,
  Check,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
  onAddMember?: () => void;
}

type RosterViewMode = "DEPARTMENTS" | "DIRECTORY";
type WorkloadFilterType = "ALL" | "AVAILABLE" | "BALANCED" | "OVERLOADED";

export function VolunteerList({ members, onMemberUpdated, onAddMember }: VolunteerListProps) {
  const [search, setSearch] = useState("");
  const [teamFilter, setTeamFilter] = useState("ALL");
  const [workloadFilter, setWorkloadFilter] = useState<WorkloadFilterType>("ALL");
  const [viewMode, setViewMode] = useState<RosterViewMode>("DEPARTMENTS");
  const [collapsedTeams, setCollapsedTeams] = useState<Record<string, boolean>>({});
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  // Collect unique teams
  const allTeams = useMemo(() => {
    return Array.from(new Set(members.map((m) => m.team).filter(Boolean))) as string[];
  }, [members]);

  // Telemetry metrics
  const totalVolunteers = members.filter((m) => m.role === "VOLUNTEER").length;
  const totalOrganizers = members.filter((m) => m.role === "ORGANIZER").length;
  const totalOpenTasks = members.reduce((acc, m) => acc + (m.openTasks || 0), 0);
  const overloadedMembers = members.filter((m) => m.openTasks >= 6);
  const availableMembers = members.filter((m) => m.openTasks === 0);

  // Filtered members
  const filtered = useMemo(() => {
    return members.filter((m) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        const match =
          m.name.toLowerCase().includes(q) ||
          (m.email && m.email.toLowerCase().includes(q)) ||
          (m.team && m.team.toLowerCase().includes(q)) ||
          m.skills.some((s) => s.toLowerCase().includes(q));
        if (!match) return false;
      }
      if (teamFilter !== "ALL" && m.team !== teamFilter) return false;

      if (workloadFilter === "AVAILABLE" && m.openTasks > 0) return false;
      if (workloadFilter === "BALANCED" && (m.openTasks === 0 || m.openTasks >= 6)) return false;
      if (workloadFilter === "OVERLOADED" && m.openTasks < 6) return false;

      return true;
    });
  }, [members, search, teamFilter, workloadFilter]);

  // Group members by department
  const membersByDepartment = useMemo(() => {
    const map = new Map<string, MemberRow[]>();
    allTeams.forEach((t) => map.set(t, []));
    map.set("General & Cross-Team", []);

    filtered.forEach((m) => {
      const key = m.team && m.team.trim() ? m.team.trim() : "General & Cross-Team";
      const list = map.get(key) || [];
      list.push(m);
      map.set(key, list);
    });

    return Array.from(map.entries()).filter(([_, list]) => list.length > 0);
  }, [filtered, allTeams]);

  const handleCopyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    toast.success("Email copied to clipboard");
    setTimeout(() => setCopiedEmail(null), 2000);
  };

  const toggleTeamCollapse = (name: string) => {
    setCollapsedTeams((prev) => ({
      ...prev,
      [name]: !prev[name],
    }));
  };

  return (
    <div className="space-y-5">
      {/* 1. Capacity & Workload Telemetry Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Roster */}
        <div className="p-4 rounded-2xl glass-architectural border border-[#CAAA98]/40 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-[#4B4038] uppercase tracking-wider">
              Total Roster
            </span>
            <div className="w-7 h-7 rounded-xl bg-[#202940] text-[#FAF8F5] flex items-center justify-center">
              <Users className="w-4 h-4 text-[#CAAA98]" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#202940]">{members.length}</span>
            <span className="text-[11px] text-[#9A8678] font-medium">
              {totalVolunteers} volunteers • {totalOrganizers} leads
            </span>
          </div>
        </div>

        {/* Staffed Departments */}
        <div className="p-4 rounded-2xl glass-architectural border border-[#CAAA98]/40 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-[#4B4038] uppercase tracking-wider">
              Departments
            </span>
            <div className="w-7 h-7 rounded-xl bg-[#CAAA98]/25 text-[#202940] flex items-center justify-center">
              <Layers className="w-4 h-4 text-[#202940]" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#202940]">{allTeams.length}</span>
            <span className="text-[11px] text-[#9A8678] font-medium">operational teams</span>
          </div>
        </div>

        {/* Open Tasks Distributed */}
        <div className="p-4 rounded-2xl glass-architectural border border-[#CAAA98]/40 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-[#4B4038] uppercase tracking-wider">
              Assigned Workload
            </span>
            <div className="w-7 h-7 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <Clock className="w-4 h-4 text-amber-700" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#202940]">{totalOpenTasks}</span>
            <span className="text-[11px] text-[#9A8678] font-medium">open deliverables</span>
          </div>
        </div>

        {/* Burnout Alert */}
        <div
          onClick={() => setWorkloadFilter(workloadFilter === "OVERLOADED" ? "ALL" : "OVERLOADED")}
          className={cn(
            "p-4 rounded-2xl border transition-all cursor-pointer shadow-xs",
            overloadedMembers.length > 0
              ? "bg-rose-50/85 border-rose-300/80 hover:border-rose-400"
              : "glass-architectural border-[#CAAA98]/40"
          )}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-[#4B4038] uppercase tracking-wider">
              Burnout Guard
            </span>
            <div
              className={cn(
                "w-7 h-7 rounded-xl flex items-center justify-center",
                overloadedMembers.length > 0
                  ? "bg-rose-200 text-rose-800"
                  : "bg-emerald-100 text-emerald-800"
              )}
            >
              {overloadedMembers.length > 0 ? (
                <ShieldAlert className="w-4 h-4 text-rose-700" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              )}
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span
              className={cn(
                "text-2xl font-black",
                overloadedMembers.length > 0 ? "text-rose-700" : "text-emerald-800"
              )}
            >
              {overloadedMembers.length}
            </span>
            <span className="text-[11px] text-[#9A8678] font-medium">
              {overloadedMembers.length > 0 ? "overloaded (≥6 tasks)" : "workload balanced"}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Control Toolbar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 p-3.5 rounded-2xl glass-architectural border border-[#CAAA98]/40 shadow-xs backdrop-blur-xl">
        {/* Search */}
        <div className="flex items-center gap-2 flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-[#9A8678] ml-1" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search volunteers by name, skills, email, team..."
            className="h-9 text-xs glass-architectural-input font-medium rounded-xl"
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
          {/* Team Filter */}
          {allTeams.length > 0 && (
            <select
              value={teamFilter}
              onChange={(e) => setTeamFilter(e.target.value)}
              className="h-9 px-3 text-xs rounded-xl bg-white/80 border border-[#CAAA98]/60 text-[#202940] font-semibold focus:outline-none focus:border-[#202940] cursor-pointer"
            >
              <option value="ALL">All Departments</option>
              {allTeams.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          )}

          {/* Workload Filter */}
          <select
            value={workloadFilter}
            onChange={(e) => setWorkloadFilter(e.target.value as WorkloadFilterType)}
            className="h-9 px-3 text-xs rounded-xl bg-white/80 border border-[#CAAA98]/60 text-[#202940] font-semibold focus:outline-none focus:border-[#202940] cursor-pointer"
          >
            <option value="ALL">All Workloads</option>
            <option value="AVAILABLE">Available ({availableMembers.length})</option>
            <option value="BALANCED">Balanced</option>
            <option value="OVERLOADED">Overloaded ({overloadedMembers.length})</option>
          </select>

          {/* View Mode Toggle Switch */}
          <div className="flex items-center p-1 rounded-xl bg-[#FAF8F5] border border-[#CAAA98]/50 shadow-2xs ml-auto sm:ml-0">
            <button
              type="button"
              onClick={() => setViewMode("DEPARTMENTS")}
              className={cn(
                "px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
                viewMode === "DEPARTMENTS"
                  ? "bg-[#202940] text-[#FAF8F5] shadow-xs"
                  : "text-[#4B4038] hover:text-[#202940]"
              )}
            >
              <Users2 className="w-3.5 h-3.5" />
              <span>By Department</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode("DIRECTORY")}
              className={cn(
                "px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
                viewMode === "DIRECTORY"
                  ? "bg-[#202940] text-[#FAF8F5] shadow-xs"
                  : "text-[#4B4038] hover:text-[#202940]"
              )}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Directory</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Empty State */}
      {filtered.length === 0 && (
        <div className="p-12 text-center rounded-2xl glass-architectural border border-[#CAAA98]/40 flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#CAAA98]/20 flex items-center justify-center text-[#9A8678]">
            <Users className="w-6 h-6 text-[#9A8678]" />
          </div>
          <div>
            <h4 className="font-extrabold text-sm text-[#202940]">No team members found</h4>
            <p className="text-xs text-[#9A8678] max-w-sm mt-0.5">
              {search || teamFilter !== "ALL" || workloadFilter !== "ALL"
                ? "No members match your current filters. Try resetting search filters."
                : "No members or volunteers have been assigned to this event yet."}
            </p>
          </div>
          {onAddMember && (
            <button
              type="button"
              onClick={onAddMember}
              className="mt-2 px-4 py-2 rounded-xl bg-[#202940] hover:bg-[#182033] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              Add Member to Roster
            </button>
          )}
        </div>
      )}

      {/* 4. VIEW MODE 1: BY DEPARTMENT WORKGROUPS */}
      {filtered.length > 0 && viewMode === "DEPARTMENTS" && (
        <div className="space-y-4">
          {membersByDepartment.map(([deptName, deptMembers]) => {
            const isCollapsed = !!collapsedTeams[deptName];
            const deptOpenTasks = deptMembers.reduce((a, m) => a + (m.openTasks || 0), 0);
            const deptCompletedTasks = deptMembers.reduce((a, m) => a + (m.completedTasks || 0), 0);
            const totalDeptTasks = deptOpenTasks + deptCompletedTasks;
            const completionPct = totalDeptTasks > 0 ? Math.round((deptCompletedTasks / totalDeptTasks) * 100) : 0;

            return (
              <div
                key={deptName}
                className="rounded-2xl border border-[#CAAA98]/50 glass-architectural shadow-xs overflow-hidden transition-all"
              >
                {/* Department Header */}
                <div
                  onClick={() => toggleTeamCollapse(deptName)}
                  className="p-4 bg-white/70 hover:bg-white/90 border-b border-[#CAAA98]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      className="p-1 text-[#9A8678] hover:text-[#202940] rounded-lg transition-colors"
                    >
                      {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                    </button>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-extrabold text-sm text-[#202940]">{deptName}</h4>
                        <span className="px-2 py-0.5 rounded-full bg-[#CAAA98]/25 text-[#202940] font-bold text-[10px] border border-[#CAAA98]/40">
                          {deptMembers.length} member{deptMembers.length > 1 ? "s" : ""}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#9A8678]">
                        {deptOpenTasks} active deliverable{deptOpenTasks !== 1 ? "s" : ""} currently assigned
                      </p>
                    </div>
                  </div>

                  {/* Department Completion Metric */}
                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    <div className="text-right">
                      <div className="text-xs font-bold text-[#202940]">
                        {deptCompletedTasks}/{totalDeptTasks} Tasks Done
                      </div>
                      <div className="text-[10px] text-[#9A8678] font-medium">{completionPct}% Workload Complete</div>
                    </div>
                    <div className="w-24 h-2 rounded-full bg-[#CAAA98]/30 overflow-hidden">
                      <div
                        style={{ width: `${completionPct}%` }}
                        className="h-full bg-emerald-600 transition-all duration-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Members Grid in this department */}
                {!isCollapsed && (
                  <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 bg-white/40">
                    {deptMembers.map((member) => (
                      <MemberCard
                        key={member.id}
                        member={member}
                        copiedEmail={copiedEmail}
                        onCopyEmail={handleCopyEmail}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 5. VIEW MODE 2: DIRECTORY GRID */}
      {filtered.length > 0 && viewMode === "DIRECTORY" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((member) => (
            <MemberCard
              key={member.id}
              member={member}
              copiedEmail={copiedEmail}
              onCopyEmail={handleCopyEmail}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Architectural Volunteer/Member Card
 */
function MemberCard({
  member,
  copiedEmail,
  onCopyEmail,
}: {
  member: MemberRow;
  copiedEmail: string | null;
  onCopyEmail: (email: string) => void;
}) {
  const isOverloaded = member.openTasks >= 6;
  const initials = member.name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      className={cn(
        "p-4 rounded-2xl border transition-all space-y-3 shadow-xs backdrop-blur-md group flex flex-col justify-between",
        isOverloaded
          ? "bg-rose-50/80 border-rose-300 hover:border-rose-400"
          : "bg-white/95 border-[#CAAA98]/45 hover:border-[#CAAA98] hover:shadow-md"
      )}
    >
      <div className="space-y-2.5">
        {/* Header: Avatar, Name, Role Badge */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#202940] text-[#FAF8F5] font-bold text-xs flex items-center justify-center shadow-xs">
              {initials}
            </div>
            <div>
              <div className="font-extrabold text-[#202940] text-sm leading-tight flex items-center gap-1.5">
                <span>{member.name}</span>
                {isOverloaded && (
                  <span title="Overloaded with ≥6 tasks">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                  </span>
                )}
              </div>
              <div className="text-[11px] text-[#9A8678] font-semibold mt-0.5">
                {member.team || "General Roster"}
              </div>
            </div>
          </div>

          <Badge
            variant={member.role === "ORGANIZER" ? "default" : "secondary"}
            className="text-[10px] uppercase font-mono px-2 py-0.5"
          >
            {member.role}
          </Badge>
        </div>

        {/* Email with copy button */}
        {member.email ? (
          <div className="flex items-center justify-between text-[11px] text-[#4B4038] bg-[#FAF8F5] px-2.5 py-1 rounded-xl border border-[#CAAA98]/30">
            <span className="truncate max-w-[170px] font-mono">{member.email}</span>
            <button
              type="button"
              onClick={() => onCopyEmail(member.email!)}
              className="p-1 text-[#9A8678] hover:text-[#202940] transition-colors cursor-pointer"
              title="Copy email"
            >
              {copiedEmail === member.email ? (
                <Check className="w-3 h-3 text-emerald-600" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </button>
          </div>
        ) : (
          <div className="text-[11px] text-[#9A8678] italic px-1">No email registered</div>
        )}

        {/* Skills Tag Cloud */}
        {member.skills && member.skills.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-0.5">
            {member.skills.map((s, idx) => (
              <span
                key={idx}
                className="text-[10px] px-2 py-0.5 rounded-md bg-[#FAF8F5] text-[#4B4038] border border-[#CAAA98]/40 font-medium"
              >
                {s}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Footer: Availability & Workload Progress Bar */}
      <div className="pt-2 border-t border-[#CAAA98]/25 space-y-1.5">
        {member.availability && (
          <div className="flex items-center justify-between text-[10.5px] text-[#9A8678]">
            <span>Availability:</span>
            <span className="font-semibold text-[#4B4038]">{member.availability}</span>
          </div>
        )}

        <WorkloadBar
          openTasks={member.openTasks}
          completedTasks={member.completedTasks}
          maxRecommended={6}
          showDetails={true}
        />
      </div>
    </div>
  );
}
