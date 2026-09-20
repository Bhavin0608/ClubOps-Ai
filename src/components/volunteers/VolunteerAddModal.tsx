"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserPlus, X, Loader2, Sparkles, Check, Users, Shield, Award } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const COMMON_DEPARTMENTS = [
  "Logistics",
  "Technical & AV",
  "Design & Media",
  "Marketing",
  "Sponsorship",
  "Hospitality",
  "Operations",
];

const SKILL_SUGGESTIONS = [
  "Crowd Control",
  "Stage Audio",
  "Graphic Design",
  "Sponsor Relations",
  "Photography",
  "Python / Tech",
  "First Aid",
  "Check-in Desk",
];

const FAST_PASS_MEMBERS = [
  {
    name: "Rohan Varma",
    email: "rohan.varma@campus.edu",
    role: "ORGANIZER" as const,
    team: "Logistics",
    skills: "Crowd Control, Check-in Desk",
    availability: "Full Event",
  },
  {
    name: "Ananya Deshmukh",
    email: "ananya.d@campus.edu",
    role: "VOLUNTEER" as const,
    team: "Technical & AV",
    skills: "Stage Audio, Python / Tech",
    availability: "Full Event",
  },
  {
    name: "Aditya Roy",
    email: "aditya.roy@campus.edu",
    role: "VOLUNTEER" as const,
    team: "Design & Media",
    skills: "Graphic Design, Photography",
    availability: "Weekend Only",
  },
];

export function VolunteerAddModal({
  eventId,
  onAdded,
}: {
  eventId: string;
  onAdded?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"VOLUNTEER" | "ORGANIZER">("VOLUNTEER");
  const [team, setTeam] = useState("");
  const [skills, setSkills] = useState("");
  const [availability, setAvailability] = useState("Full Event");

  const handleApplyFastPass = (demo: (typeof FAST_PASS_MEMBERS)[0]) => {
    setName(demo.name);
    setEmail(demo.email);
    setRole(demo.role);
    setTeam(demo.team);
    setSkills(demo.skills);
    setAvailability(demo.availability);
    toast.info(`Fast-pass loaded: ${demo.name}`);
  };

  const handleToggleSkill = (skill: string) => {
    const currentSkills = skills
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (currentSkills.includes(skill)) {
      setSkills(currentSkills.filter((s) => s !== skill).join(", "));
    } else {
      setSkills([...currentSkills, skill].join(", "));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Member name is required");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/events/${eventId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim() || undefined,
          role,
          team: team.trim() || undefined,
          skills: skills ? skills.split(",").map((s) => s.trim()).filter(Boolean) : [],
          availability,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add member");

      toast.success(`${name} added to the operational roster`);
      setOpen(false);
      setName("");
      setEmail("");
      setTeam("");
      setSkills("");
      setAvailability("Full Event");
      onAdded?.();
    } catch (err: any) {
      toast.error(err.message || "Failed to add member");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        size="sm"
        onClick={() => setOpen(true)}
        className="bg-[#202940] hover:bg-[#182033] text-[#FAF8F5] gap-1.5 text-xs font-bold h-9 px-3.5 rounded-xl shadow-md shadow-[#202940]/15 hover:shadow-lg transition-all border border-[#CAAA98]/30"
      >
        <UserPlus className="w-4 h-4 text-[#CAAA98]" />
        <span>Add Volunteer</span>
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#202940]/45 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg max-h-[92vh] flex flex-col glass-architectural rounded-[28px] border border-[#CAAA98]/60 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#CAAA98]/30 bg-white/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#CAAA98]/25 border border-[#CAAA98]/50 flex items-center justify-center text-[#202940] shadow-xs">
                  <UserPlus className="w-5 h-5 text-[#202940]" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#202940]">
                    Add Member to Roster
                  </h3>
                  <p className="text-[11px] text-[#9A8678] font-medium">
                    Allocate volunteers, assign departmental roles & configure availability
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-xl text-[#9A8678] hover:text-[#202940] hover:bg-[#CAAA98]/20 transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 text-xs">
              {/* Fast Pass Templates */}
              <div className="p-3 rounded-2xl bg-white/60 border border-[#CAAA98]/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#4B4038] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#CAAA98]" />
                    Fast-Pass Demo Roster:
                  </span>
                  <span className="text-[10px] text-[#9A8678]">1-click populate</span>
                </div>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                  {FAST_PASS_MEMBERS.map((demo) => (
                    <button
                      key={demo.name}
                      type="button"
                      onClick={() => handleApplyFastPass(demo)}
                      className="px-2.5 py-1 rounded-xl bg-[#FAF8F5] hover:bg-[#202940] hover:text-white border border-[#CAAA98]/40 text-[11px] font-medium text-[#4B4038] whitespace-nowrap transition-all shadow-2xs cursor-pointer"
                    >
                      {demo.name} ({demo.team})
                    </button>
                  ))}
                </div>
              </div>

              <form id="add-member-form" onSubmit={handleSubmit} className="space-y-4">
                {/* Full Name */}
                <div className="space-y-1.5">
                  <label className="text-[#4B4038] font-bold">
                    Full Name <span className="text-rose-600">*</span>
                  </label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Rohan Varma"
                    className="glass-architectural-input h-10 px-3.5 text-sm rounded-xl font-semibold placeholder:text-[#9A8678]/70"
                    required
                  />
                </div>

                {/* Email & Role Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Email */}
                  <div className="space-y-1.5">
                    <label className="text-[#4B4038] font-bold">Campus / Login Email</label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="rohan@campus.edu"
                      className="glass-architectural-input h-10 px-3.5 text-xs rounded-xl font-medium"
                    />
                  </div>

                  {/* Operational Role Selection Chips */}
                  <div className="space-y-1.5">
                    <label className="text-[#4B4038] font-bold">Operational Role</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setRole("VOLUNTEER")}
                        className={cn(
                          "h-10 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer border",
                          role === "VOLUNTEER"
                            ? "bg-[#202940] text-white border-[#202940] shadow-xs"
                            : "bg-white/80 text-[#4B4038] border-[#CAAA98]/50 hover:bg-[#CAAA98]/20"
                        )}
                      >
                        <Users className="w-3.5 h-3.5" />
                        Volunteer
                      </button>

                      <button
                        type="button"
                        onClick={() => setRole("ORGANIZER")}
                        className={cn(
                          "h-10 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer border",
                          role === "ORGANIZER"
                            ? "bg-[#202940] text-white border-[#202940] shadow-xs"
                            : "bg-white/80 text-[#4B4038] border-[#CAAA98]/50 hover:bg-[#CAAA98]/20"
                        )}
                      >
                        <Shield className="w-3.5 h-3.5" />
                        Organizer
                      </button>
                    </div>
                  </div>
                </div>

                {/* Department / Team Section */}
                <div className="space-y-2 p-3.5 rounded-2xl bg-white/60 border border-[#CAAA98]/40">
                  <div className="flex items-center justify-between">
                    <label className="text-[#4B4038] font-bold">Assigned Department / Team</label>
                    {team && (
                      <button
                        type="button"
                        onClick={() => setTeam("")}
                        className="text-[10px] text-[#9A8678] hover:text-rose-600 font-semibold"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <Input
                    value={team}
                    onChange={(e) => setTeam(e.target.value)}
                    placeholder="Enter or select department..."
                    className="glass-architectural-input h-9 px-3 text-xs rounded-xl font-semibold"
                  />

                  {/* Common department quick chips */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {COMMON_DEPARTMENTS.map((dept) => {
                      const isSelected = team.toLowerCase() === dept.toLowerCase();
                      return (
                        <button
                          key={dept}
                          type="button"
                          onClick={() => setTeam(isSelected ? "" : dept)}
                          className={cn(
                            "px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-all border cursor-pointer flex items-center gap-1",
                            isSelected
                              ? "bg-[#202940] text-[#FAF8F5] border-[#202940] shadow-xs"
                              : "bg-[#FAF8F5] text-[#4B4038] border-[#CAAA98]/50 hover:bg-[#CAAA98]/20"
                          )}
                        >
                          <span>{dept}</span>
                          {isSelected && <Check className="w-3 h-3 text-[#CAAA98]" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Skills & Tag Cloud */}
                <div className="space-y-2">
                  <label className="text-[#4B4038] font-bold">Skills & Proficiencies</label>
                  <Input
                    value={skills}
                    onChange={(e) => setSkills(e.target.value)}
                    placeholder="e.g., Crowd Control, Stage Audio, First Aid (comma-separated)"
                    className="glass-architectural-input h-9 px-3 text-xs rounded-xl font-medium"
                  />
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    {SKILL_SUGGESTIONS.map((skill) => {
                      const isIncluded = skills
                        .split(",")
                        .map((s) => s.trim().toLowerCase())
                        .includes(skill.toLowerCase());
                      return (
                        <button
                          key={skill}
                          type="button"
                          onClick={() => handleToggleSkill(skill)}
                          className={cn(
                            "px-2 py-0.5 rounded-lg text-[10.5px] font-semibold transition-all border cursor-pointer",
                            isIncluded
                              ? "bg-[#202940] text-white border-[#202940]"
                              : "bg-white/80 text-[#4B4038] border-[#CAAA98]/40 hover:bg-[#CAAA98]/20"
                          )}
                        >
                          {isIncluded ? `✓ ${skill}` : `+ ${skill}`}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Availability */}
                <div className="space-y-1.5">
                  <label className="text-[#4B4038] font-bold">Shift & Availability</label>
                  <div className="grid grid-cols-3 gap-2">
                    {["Full Event", "Weekend Only", "On-Call Shifts"].map((shift) => (
                      <button
                        key={shift}
                        type="button"
                        onClick={() => setAvailability(shift)}
                        className={cn(
                          "h-8 rounded-xl text-[11px] font-semibold border transition-all cursor-pointer",
                          availability === shift
                            ? "bg-[#202940] text-white border-[#202940] shadow-xs"
                            : "bg-white/80 text-[#4B4038] border-[#CAAA98]/50 hover:bg-[#CAAA98]/20"
                        )}
                      >
                        {shift}
                      </button>
                    ))}
                  </div>
                </div>
              </form>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-[#CAAA98]/30 bg-white/50 backdrop-blur-md">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="h-9 px-4 rounded-xl border border-[#CAAA98]/50 hover:bg-[#CAAA98]/20 text-xs font-semibold text-[#4B4038] cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                form="add-member-form"
                disabled={loading || !name.trim()}
                className="h-10 px-5 rounded-xl bg-[#202940] hover:bg-[#182033] text-[#FAF8F5] text-xs font-bold shadow-md shadow-[#202940]/20 hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 border border-[#CAAA98]/35"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#CAAA98]" />
                    <span>Adding Member...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm & Add to Roster</span>
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
