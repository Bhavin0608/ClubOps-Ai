"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserPlus, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/events/${eventId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email: email || undefined,
          role,
          team: team || undefined,
          skills: skills ? skills.split(",").map((s) => s.trim()).filter(Boolean) : [],
          availability,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add member");

      toast.success(`${name} added to the roster`);
      setOpen(false);
      setName("");
      setEmail("");
      setTeam("");
      setSkills("");
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
        className="bg-[#202940] hover:bg-[#2c395b] text-white gap-1.5 text-xs font-bold h-8 shadow-xs"
      >
        <UserPlus className="w-3.5 h-3.5" />
        Add Member
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#202940]/40 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md bg-white/95 border border-[#CAAA98]/60 rounded-2xl shadow-2xl p-6 space-y-4 backdrop-blur-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#CAAA98]/30">
              <h3 className="text-base font-extrabold text-[#202940]">Add Volunteer or Organizer</h3>
              <button onClick={() => setOpen(false)} className="p-1 rounded-lg text-[#9A8678] hover:text-[#202940] hover:bg-[#CAAA98]/20 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="text-[#4B4038] font-bold">Full Name *</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Priya Sharma"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[#4B4038] font-bold">Email (Optional)</label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="priya@college.edu"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[#4B4038] font-bold">Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="w-full h-9 px-3 rounded-lg bg-[#FAF8F5] border border-[#CAAA98]/60 text-[#202940] font-semibold text-xs focus:outline-none focus:border-[#202940]"
                  >
                    <option value="VOLUNTEER">Volunteer</option>
                    <option value="ORGANIZER">Organizer</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[#4B4038] font-bold">Team</label>
                  <Input
                    value={team}
                    onChange={(e) => setTeam(e.target.value)}
                    placeholder="Sponsorship, Tech, etc."
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[#4B4038] font-bold">Availability</label>
                  <Input
                    value={availability}
                    onChange={(e) => setAvailability(e.target.value)}
                    placeholder="Full Event, Shifts, etc."
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[#4B4038] font-bold">Skills (comma-separated)</label>
                <Input
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  placeholder="Design, Figma, Negotiation, AV"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#CAAA98]/30">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setOpen(false)}
                  className="border-[#CAAA98]/60 hover:bg-[#CAAA98]/20 text-[#4B4038] font-bold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={loading}
                  className="bg-[#202940] hover:bg-[#2c395b] text-white font-bold shadow-xs"
                >
                  {loading && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
                  Add to Roster
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
