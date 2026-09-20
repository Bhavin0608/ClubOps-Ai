"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  X,
  Loader2,
  Check,
  CheckSquare,
  Sparkles,
  Clock,
  AlertCircle,
  ShieldAlert,
  Info,
  Users,
  Calendar,
  ArrowRight,
  Link2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface MemberOption {
  id: string;
  name: string;
  team?: string | null;
  role?: string | null;
}

export interface ExistingTaskOption {
  id: string;
  title: string;
  team?: string | null;
  status?: string;
}

interface TaskCreateModalProps {
  eventId: string;
  members: MemberOption[];
  existingTasks?: ExistingTaskOption[];
  onTaskCreated?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  triggerButton?: React.ReactNode;
}

type PriorityLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

const PRIORITY_OPTIONS: {
  value: PriorityLevel;
  label: string;
  subtitle: string;
  icon: React.ElementType;
  activeClass: string;
  checkpointClass: string;
  iconClass: string;
  badgeClass: string;
}[] = [
  {
    value: "LOW",
    label: "Low",
    subtitle: "Flexible timeline",
    icon: Info,
    activeClass:
      "border-emerald-500/80 bg-emerald-50/70 text-emerald-950 shadow-sm ring-2 ring-emerald-500/20",
    checkpointClass: "bg-emerald-600 border-emerald-600 text-white",
    iconClass: "text-emerald-700",
    badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
  {
    value: "MEDIUM",
    label: "Medium",
    subtitle: "Standard delivery",
    icon: Clock,
    activeClass:
      "border-[#CAAA98] bg-[#FAF8F5] text-[#202940] shadow-sm ring-2 ring-[#CAAA98]/40",
    checkpointClass: "bg-[#202940] border-[#202940] text-white",
    iconClass: "text-[#9A8678]",
    badgeClass: "bg-[#CAAA98]/25 text-[#4B4038] border-[#CAAA98]/50",
  },
  {
    value: "HIGH",
    label: "High",
    subtitle: "Priority milestone",
    icon: AlertCircle,
    activeClass:
      "border-amber-500/80 bg-amber-50/70 text-amber-950 shadow-sm ring-2 ring-amber-500/25",
    checkpointClass: "bg-amber-600 border-amber-600 text-white",
    iconClass: "text-amber-700",
    badgeClass: "bg-amber-100 text-amber-800 border-amber-200",
  },
  {
    value: "CRITICAL",
    label: "Critical",
    subtitle: "Immediate blocker",
    icon: ShieldAlert,
    activeClass:
      "border-rose-500 bg-rose-50/90 text-rose-950 shadow-md ring-2 ring-rose-500/30 glow-critical",
    checkpointClass: "bg-rose-600 border-rose-600 text-white",
    iconClass: "text-rose-700",
    badgeClass: "bg-rose-100 text-rose-900 border-rose-300 font-bold",
  },
];

const DEFAULT_COMMON_TEAMS = [
  "Logistics",
  "Technical",
  "Design & Media",
  "Marketing",
  "Sponsorship",
  "Hospitality",
  "Operations",
  "PR & Outreach",
];

const FAST_PRESETS = [
  {
    title: "Stage & AV Setup Coordination",
    description: "Inspect audio systems, microphony channels, projector feeds, and stage positioning.",
    team: "Technical",
    priority: "HIGH" as PriorityLevel,
    daysOffset: 2,
  },
  {
    title: "Sponsorship Deck & Partner Follow-up",
    description: "Send confirmed agenda and logo exposure deliverables to registered corporate sponsors.",
    team: "Sponsorship",
    priority: "MEDIUM" as PriorityLevel,
    daysOffset: 4,
  },
  {
    title: "Social Media Teaser & Poster Release",
    description: "Distribute keynote speaker reveal creative across LinkedIn, Instagram, and campus networks.",
    team: "Design & Media",
    priority: "MEDIUM" as PriorityLevel,
    daysOffset: 3,
  },
  {
    title: "Emergency Contingency & First-Aid Desk",
    description: "Establish dedicated first response area, emergency contacts list, and crowd control ropes.",
    team: "Logistics",
    priority: "CRITICAL" as PriorityLevel,
    daysOffset: 1,
  },
];

export function TaskCreateModal({
  eventId,
  members,
  existingTasks = [],
  onTaskCreated,
  open: controlledOpen,
  onOpenChange,
  triggerButton,
}: TaskCreateModalProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  const setOpenState = (next: boolean) => {
    if (isControlled) {
      onOpenChange?.(next);
    } else {
      setInternalOpen(next);
    }
  };

  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [team, setTeam] = useState("");
  const [priority, setPriority] = useState<PriorityLevel>("MEDIUM");
  const [deadline, setDeadline] = useState("");
  const [ownerId, setOwnerId] = useState("");
  const [prerequisiteIds, setPrerequisiteIds] = useState<string[]>([]);
  const [showDependencies, setShowDependencies] = useState(false);
  const [isTeamFocused, setIsTeamFocused] = useState(false);

  // Compute common teams dynamically based on event task and member distribution
  const mostCommonTeams = useMemo(() => {
    const frequencyMap = new Map<string, number>();

    // Seed defaults with base counts
    DEFAULT_COMMON_TEAMS.forEach((t) => {
      frequencyMap.set(t, 1);
    });

    // Count from existing event tasks
    existingTasks.forEach((t) => {
      if (t.team && t.team.trim()) {
        const clean = t.team.trim();
        frequencyMap.set(clean, (frequencyMap.get(clean) || 0) + 3);
      }
    });

    // Count from event members
    members.forEach((m) => {
      if (m.team && m.team.trim()) {
        const clean = m.team.trim();
        frequencyMap.set(clean, (frequencyMap.get(clean) || 0) + 2);
      }
    });

    return Array.from(frequencyMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([teamName]) => teamName);
  }, [existingTasks, members]);

  // Filtered teams for autocomplete dropdown when typing
  const matchingTeams = useMemo(() => {
    if (!team.trim()) return mostCommonTeams.slice(0, 6);
    const query = team.toLowerCase();
    return mostCommonTeams
      .filter((t) => t.toLowerCase().includes(query))
      .slice(0, 5);
  }, [team, mostCommonTeams]);

  // Selected owner object
  const selectedOwner = useMemo(() => {
    return members.find((m) => m.id === ownerId);
  }, [members, ownerId]);

  const handleApplyPreset = (preset: (typeof FAST_PRESETS)[0]) => {
    setTitle(preset.title);
    setDescription(preset.description);
    setTeam(preset.team);
    setPriority(preset.priority);
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + preset.daysOffset);
    setDeadline(targetDate.toISOString().split("T")[0]);
    toast.info(`Preset applied: ${preset.title}`);
  };

  const setDateShortcut = (daysFromNow: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysFromNow);
    setDeadline(d.toISOString().split("T")[0]);
  };

  const handleTogglePrerequisite = (id: string) => {
    setPrerequisiteIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Please provide a task title");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/events/${eventId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          team: team.trim() || undefined,
          priority,
          deadline: deadline || undefined,
          ownerId: ownerId || null,
          prerequisiteIds: prerequisiteIds.length > 0 ? prerequisiteIds : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create task");

      toast.success("Task created and scheduled successfully");
      setOpenState(false);
      resetForm();
      onTaskCreated?.();
    } catch (err: any) {
      toast.error(err.message || "Failed to create task");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setTeam("");
    setPriority("MEDIUM");
    setDeadline("");
    setOwnerId("");
    setPrerequisiteIds([]);
    setShowDependencies(false);
  };

  return (
    <>
      {triggerButton ? (
        <div onClick={() => setOpenState(true)}>{triggerButton}</div>
      ) : (
        <Button
          size="sm"
          onClick={() => setOpenState(true)}
          className="bg-[#202940] hover:bg-[#182033] text-[#FAF8F5] gap-1.5 text-xs font-bold h-9 px-3.5 rounded-xl shadow-md shadow-[#202940]/15 hover:shadow-lg transition-all border border-[#CAAA98]/30"
        >
          <Plus className="w-4 h-4 text-[#CAAA98]" />
          <span>Create New Task</span>
        </Button>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#202940]/45 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col glass-architectural rounded-[28px] border border-[#CAAA98]/60 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#CAAA98]/30 bg-white/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#CAAA98]/25 border border-[#CAAA98]/50 flex items-center justify-center text-[#202940] shadow-xs">
                  <CheckSquare className="w-5 h-5 text-[#202940]" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#202940] tracking-tight">
                    Create Operational Deliverable
                  </h3>
                  <p className="text-[11px] text-[#9A8678] font-medium">
                    Configure deliverable specifications, team routing, priority checkpoint & owner
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpenState(false)}
                className="p-1.5 rounded-xl text-[#9A8678] hover:text-[#202940] hover:bg-[#CAAA98]/20 transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              {/* Fast Fill Presets Carousel/Banner */}
              <div className="p-3 rounded-2xl bg-white/60 border border-[#CAAA98]/40 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#4B4038] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#CAAA98]" />
                    Fast-Pass Templates:
                  </span>
                  <span className="text-[10px] text-[#9A8678]">Click to pre-populate</span>
                </div>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                  {FAST_PRESETS.map((preset) => (
                    <button
                      key={preset.title}
                      type="button"
                      onClick={() => handleApplyPreset(preset)}
                      className="px-2.5 py-1 rounded-xl bg-[#FAF8F5] hover:bg-[#202940] hover:text-white border border-[#CAAA98]/40 text-[11px] font-medium text-[#4B4038] whitespace-nowrap transition-all flex items-center gap-1 shadow-2xs hover:shadow-xs cursor-pointer"
                    >
                      <span>{preset.title.split("&")[0]}...</span>
                    </button>
                  ))}
                </div>
              </div>

              <form id="create-task-form" onSubmit={handleSubmit} className="space-y-4 text-xs">
                {/* Task Title */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[#4B4038] font-bold flex items-center gap-1">
                      Task Title <span className="text-rose-600">*</span>
                    </label>
                    <span className="text-[10px] text-[#9A8678]">{title.length}/100 chars</span>
                  </div>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Finalize stage acoustics & microphone allocation"
                    className="glass-architectural-input h-10 px-3.5 text-sm rounded-xl font-semibold placeholder:text-[#9A8678]/70 focus-visible:ring-[#202940]"
                    required
                    maxLength={100}
                  />
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="text-[#4B4038] font-bold">Deliverable Scope & Instructions</label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide actionable specifications, logistics requirements, or acceptance criteria..."
                    rows={3}
                    className="glass-architectural-input p-3 text-xs rounded-xl font-medium placeholder:text-[#9A8678]/70 resize-none"
                  />
                </div>

                {/* Team Input with Most Common Teams Recommendations */}
                <div className="space-y-2 p-3.5 rounded-2xl bg-white/60 border border-[#CAAA98]/40 shadow-xs relative">
                  <div className="flex items-center justify-between">
                    <label className="text-[#4B4038] font-bold flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-[#9A8678]" />
                      Assigned Team / Department
                    </label>
                    {team && (
                      <button
                        type="button"
                        onClick={() => setTeam("")}
                        className="text-[10px] text-[#9A8678] hover:text-rose-600 font-semibold transition-colors"
                      >
                        Clear team
                      </button>
                    )}
                  </div>

                  {/* Team Input */}
                  <div className="relative">
                    <Input
                      value={team}
                      onChange={(e) => setTeam(e.target.value)}
                      onFocus={() => setIsTeamFocused(true)}
                      onBlur={() => setTimeout(() => setIsTeamFocused(false), 200)}
                      placeholder="e.g., Logistics, Technical, Marketing..."
                      className="glass-architectural-input h-9 px-3 text-xs rounded-xl font-semibold placeholder:text-[#9A8678]/70"
                    />

                    {/* Autocomplete Dropdown */}
                    {isTeamFocused && matchingTeams.length > 0 && (
                      <div className="absolute left-0 right-0 top-full mt-1.5 z-20 bg-white/95 border border-[#CAAA98]/60 rounded-xl shadow-lg p-1.5 backdrop-blur-xl animate-in fade-in slide-in-from-top-1 duration-150">
                        <div className="px-2 py-1 text-[10px] font-bold text-[#9A8678] uppercase tracking-wider">
                          Suggested Teams
                        </div>
                        {matchingTeams.map((t) => (
                          <button
                            key={t}
                            type="button"
                            onMouseDown={() => {
                              setTeam(t);
                              setIsTeamFocused(false);
                            }}
                            className={cn(
                              "w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer",
                              team.toLowerCase() === t.toLowerCase()
                                ? "bg-[#202940] text-white"
                                : "text-[#4B4038] hover:bg-[#CAAA98]/20"
                            )}
                          >
                            <span>{t}</span>
                            {team.toLowerCase() === t.toLowerCase() && (
                              <Check className="w-3.5 h-3.5 text-[#CAAA98]" />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Most Common Teams Quick Selection Chips */}
                  <div className="space-y-1.5 pt-1">
                    <div className="text-[10.5px] font-bold text-[#9A8678] flex items-center gap-1">
                      <span>Most Common Teams:</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {mostCommonTeams.slice(0, 6).map((commonTeam) => {
                        const isSelected = team.toLowerCase() === commonTeam.toLowerCase();
                        return (
                          <button
                            key={commonTeam}
                            type="button"
                            onClick={() => setTeam(isSelected ? "" : commonTeam)}
                            className={cn(
                              "px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-all flex items-center gap-1.5 cursor-pointer border",
                              isSelected
                                ? "bg-[#202940] text-[#FAF8F5] border-[#202940] shadow-xs"
                                : "bg-[#FAF8F5] text-[#4B4038] border-[#CAAA98]/50 hover:bg-[#CAAA98]/20 hover:border-[#CAAA98]"
                            )}
                          >
                            <span>{commonTeam}</span>
                            {isSelected && <Check className="w-3 h-3 text-[#CAAA98]" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Assignee Team Suggestion Hint */}
                  {selectedOwner?.team && selectedOwner.team.toLowerCase() !== team.toLowerCase() && (
                    <div className="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-[#CAAA98]/20 border border-[#CAAA98]/40 text-[11px] text-[#4B4038]">
                      <span>
                        Assignee is in team <strong>{selectedOwner.team}</strong>
                      </span>
                      <button
                        type="button"
                        onClick={() => setTeam(selectedOwner.team || "")}
                        className="text-[#202940] font-bold hover:underline cursor-pointer"
                      >
                        Apply team
                      </button>
                    </div>
                  )}
                </div>

                {/* Priority Checkpoint Selection (Replaced dropdown) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[#4B4038] font-bold flex items-center gap-1.5">
                      Priority Level Checkpoint <span className="text-rose-600">*</span>
                    </label>
                    <span className="text-[10.5px] font-semibold text-[#9A8678]">
                      Active: {priority}
                    </span>
                  </div>

                  {/* 4 Checkpoint Selection Cards */}
                  <div
                    role="radiogroup"
                    aria-label="Task Priority Level"
                    className="grid grid-cols-2 sm:grid-cols-4 gap-2.5"
                  >
                    {PRIORITY_OPTIONS.map((opt) => {
                      const isSelected = priority === opt.value;
                      const IconComponent = opt.icon;

                      return (
                        <button
                          key={opt.value}
                          type="button"
                          role="radio"
                          aria-checked={isSelected}
                          onClick={() => setPriority(opt.value)}
                          className={cn(
                            "relative flex flex-col items-start p-3 rounded-2xl border text-left transition-all cursor-pointer select-none",
                            isSelected
                              ? opt.activeClass
                              : "bg-white/70 border-[#CAAA98]/45 text-[#4B4038] hover:bg-white hover:border-[#CAAA98] hover:shadow-2xs"
                          )}
                        >
                          {/* Top row: Icon & Radio Checkpoint */}
                          <div className="w-full flex items-center justify-between mb-2">
                            <div
                              className={cn(
                                "w-6 h-6 rounded-lg flex items-center justify-center",
                                isSelected ? opt.badgeClass : "bg-[#CAAA98]/20 text-[#4B4038]"
                              )}
                            >
                              <IconComponent className={cn("w-3.5 h-3.5", opt.iconClass)} />
                            </div>

                            {/* Checkpoint Radio Circle */}
                            <div
                              className={cn(
                                "w-4 h-4 rounded-full border flex items-center justify-center transition-all",
                                isSelected
                                  ? opt.checkpointClass
                                  : "border-[#9A8678]/50 bg-white"
                              )}
                            >
                              {isSelected && <Check className="w-2.5 h-2.5" />}
                            </div>
                          </div>

                          {/* Label & Description */}
                          <span className="font-extrabold text-xs tracking-tight text-[#202940]">
                            {opt.label}
                          </span>
                          <span className="text-[10px] text-[#9A8678] font-medium leading-tight mt-0.5">
                            {opt.subtitle}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Deadline & Assignee Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Deadline Date */}
                  <div className="space-y-1.5">
                    <label className="text-[#4B4038] font-bold flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#9A8678]" />
                      Target Deadline
                    </label>
                    <Input
                      type="date"
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                      className="glass-architectural-input h-10 px-3 text-xs rounded-xl font-semibold"
                    />

                    {/* Quick date shortcuts */}
                    <div className="flex items-center gap-1 pt-0.5 overflow-x-auto no-scrollbar">
                      <button
                        type="button"
                        onClick={() => setDateShortcut(0)}
                        className="px-2 py-0.5 rounded-lg bg-[#FAF8F5] hover:bg-[#CAAA98]/30 border border-[#CAAA98]/40 text-[10px] font-semibold text-[#4B4038] cursor-pointer"
                      >
                        Today
                      </button>
                      <button
                        type="button"
                        onClick={() => setDateShortcut(1)}
                        className="px-2 py-0.5 rounded-lg bg-[#FAF8F5] hover:bg-[#CAAA98]/30 border border-[#CAAA98]/40 text-[10px] font-semibold text-[#4B4038] cursor-pointer"
                      >
                        Tomorrow
                      </button>
                      <button
                        type="button"
                        onClick={() => setDateShortcut(3)}
                        className="px-2 py-0.5 rounded-lg bg-[#FAF8F5] hover:bg-[#CAAA98]/30 border border-[#CAAA98]/40 text-[10px] font-semibold text-[#4B4038] cursor-pointer"
                      >
                        +3 Days
                      </button>
                      <button
                        type="button"
                        onClick={() => setDateShortcut(7)}
                        className="px-2 py-0.5 rounded-lg bg-[#FAF8F5] hover:bg-[#CAAA98]/30 border border-[#CAAA98]/40 text-[10px] font-semibold text-[#4B4038] cursor-pointer"
                      >
                        +1 Week
                      </button>
                    </div>
                  </div>

                  {/* Assign Owner */}
                  <div className="space-y-1.5">
                    <label className="text-[#4B4038] font-bold flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-[#9A8678]" />
                      Assignee / Task Lead
                    </label>
                    <select
                      value={ownerId}
                      onChange={(e) => setOwnerId(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl bg-white/70 border border-[#CAAA98]/60 text-[#202940] font-semibold text-xs focus:outline-none focus:border-[#202940] focus:ring-2 focus:ring-[#202940]/10 transition-all cursor-pointer"
                    >
                      <option value="">Unassigned (Open Deliverable)</option>
                      {members.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} {m.team ? `(${m.team})` : ""} {m.role ? `• ${m.role}` : ""}
                        </option>
                      ))}
                    </select>

                    {selectedOwner ? (
                      <div className="text-[10px] text-[#9A8678] font-medium flex items-center gap-1.5 pt-0.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                        <span>Assigned to {selectedOwner.name}</span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-[#9A8678]">
                        Can be claimed or delegated later
                      </span>
                    )}
                  </div>
                </div>

                {/* Optional Dependencies & Prerequisites */}
                {existingTasks.length > 0 && (
                  <div className="p-3 rounded-2xl bg-white/50 border border-[#CAAA98]/40 space-y-2">
                    <button
                      type="button"
                      onClick={() => setShowDependencies(!showDependencies)}
                      className="w-full flex items-center justify-between text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Link2 className="w-3.5 h-3.5 text-[#202940]" />
                        <span className="font-bold text-xs text-[#202940]">
                          Prerequisites & Dependency Graph
                        </span>
                        {prerequisiteIds.length > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-[#202940] text-white text-[10px] font-bold">
                            {prerequisiteIds.length} required
                          </span>
                        )}
                      </div>
                      {showDependencies ? (
                        <ChevronUp className="w-4 h-4 text-[#9A8678]" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-[#9A8678]" />
                      )}
                    </button>

                    {showDependencies && (
                      <div className="pt-2 border-t border-[#CAAA98]/30 space-y-1.5 max-h-40 overflow-y-auto pr-1">
                        <p className="text-[11px] text-[#9A8678]">
                          Select deliverables that must reach completion before this task can start:
                        </p>
                        <div className="grid grid-cols-1 gap-1.5">
                          {existingTasks.map((et) => {
                            const isSelected = prerequisiteIds.includes(et.id);
                            return (
                              <label
                                key={et.id}
                                className={cn(
                                  "flex items-center gap-2.5 p-2 rounded-xl border text-xs cursor-pointer transition-all",
                                  isSelected
                                    ? "bg-[#202940]/10 border-[#202940] text-[#202940] font-bold"
                                    : "bg-white/70 border-[#CAAA98]/40 text-[#4B4038] hover:bg-[#FAF8F5]"
                                )}
                              >
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => handleTogglePrerequisite(et.id)}
                                  className="w-3.5 h-3.5 rounded text-[#202940] accent-[#202940]"
                                />
                                <span className="flex-1 truncate">{et.title}</span>
                                {et.team && (
                                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#CAAA98]/20 text-[#4B4038]">
                                    {et.team}
                                  </span>
                                )}
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </form>
            </div>

            {/* Modal Action Bar */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-[#CAAA98]/30 bg-white/50 backdrop-blur-md">
              <button
                type="button"
                onClick={() => setOpenState(false)}
                className="h-9 px-4 rounded-xl border border-[#CAAA98]/50 hover:bg-[#CAAA98]/20 text-xs font-semibold text-[#4B4038] transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                form="create-task-form"
                disabled={loading || !title.trim()}
                className="group relative h-10 px-5 rounded-xl bg-[#202940] hover:bg-[#182033] text-[#FAF8F5] text-xs font-bold shadow-md shadow-[#202940]/20 hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:pointer-events-none border border-[#CAAA98]/35 overflow-hidden"
              >
                <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[#CAAA98]/60 to-transparent pointer-events-none" />
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#CAAA98]" />
                    <span>Deploying Deliverable...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm & Create Deliverable</span>
                    <ArrowRight className="w-4 h-4 text-[#CAAA98] transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
