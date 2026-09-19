"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Plus, Users, MapPin, ArrowRight, Shield, Sparkles, Loader2, X, LogOut, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { formatDisplayDate } from "@/lib/dates";

interface EventItem {
  id: string;
  name: string;
  description?: string | null;
  startDate: string;
  endDate: string;
  venue?: string | null;
  expectedParticipants?: number | null;
  status: string;
  role: string;
}

export default function EventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [openCreate, setOpenCreate] = useState(false);
  const [creating, setCreating] = useState(false);

  // Form states for Scene 1 Demo
  const [name, setName] = useState("");
  const [venue, setVenue] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [expectedParticipants, setExpectedParticipants] = useState<number>(500);

  const fetchEvents = () => {
    fetch("/api/events")
      .then((res) => {
        if (res.status === 401) {
          router.push("/login");
          return [];
        }
        return res.json();
      })
      .then((data) => {
        setEvents(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleFillDemoValues = () => {
    setName("Bit N Build 2026");
    setVenue("Convention Hall A & Innovation Lab");
    const today = new Date();
    const start = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];
    const end = new Date(today.getTime() + 16 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];
    setStartDate(start);
    setEndDate(end);
    setExpectedParticipants(600);
    toast.info("Filled demo fields for Scene 1!");
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          venue,
          startDate,
          endDate,
          expectedParticipants,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create event");
      }

      toast.success(`Event "${name}" created! Entering workspace...`);
      router.push(`/events/${data.event.id}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to create event");
    } finally {
      setCreating(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-[#0b1329]/90 text-[#f8fafc] py-8 sm:py-12 px-6 sm:px-10 lg:px-12">
      <div className="max-w-6xl mx-auto space-y-10">
        {/* Top Bar with Brand and Sign Out */}
        <div className="flex items-center justify-between pb-6 border-b border-[#1c294d]">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#b9a8ec] to-[#9b88d8] flex items-center justify-center text-[#0b1329] shadow-xl shadow-[#b9a8ec]/20">
              <Shield className="w-6 h-6 text-[#0b1329]" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-[#f8fafc] tracking-tight flex items-center gap-2">
                ClubOps AI
                <span className="text-[10px] font-mono bg-[#b9a8ec]/15 text-[#b9a8ec] px-2 py-0.5 rounded-full border border-[#b9a8ec]/30 font-semibold">
                  v1.0
                </span>
              </h1>
              <p className="text-xs text-[#94a3b8]">Autonomous Operations Command Platform</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={() => setOpenCreate(true)}
              className="bg-[#b9a8ec] hover:bg-[#9b88d8] text-[#0b1329] gap-2 text-xs font-bold h-10 px-4 rounded-xl shadow-lg shadow-[#b9a8ec]/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Event (Scene 1)</span>
            </Button>

            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-2.5 rounded-xl border border-[#1c294d] bg-[#131e38]/80 text-[#94a3b8] hover:text-rose-400 hover:bg-[#1c294d] transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Hero Welcome Message */}
        <div className="space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#f8fafc] tracking-tight">
            Active Event Workspaces
          </h2>
          <p className="text-sm text-[#94a3b8] max-w-2xl leading-relaxed">
            Select an operational command center below to monitor live risk intelligence, coordinate deliverables, or run AI synthesis.
          </p>
        </div>

        {/* Events Grid */}
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center text-[#94a3b8] text-xs space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#b9a8ec]" />
            <span className="text-sm font-medium text-[#f8fafc]">Loading operational workspaces...</span>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-24 px-6 rounded-3xl border border-dashed border-[#1c294d] space-y-5 bg-[#131e38]/40 backdrop-blur-md">
            <div className="w-14 h-14 rounded-2xl bg-[#1c294d]/60 border border-[#1c294d] flex items-center justify-center mx-auto text-[#94a3b8]">
              <Calendar className="w-7 h-7 text-[#b9a8ec]" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-[#f8fafc]">No Event Workspaces Active</h3>
              <p className="text-xs text-[#94a3b8] max-w-md mx-auto leading-relaxed">
                Initialize your first event to deploy automated runbooks, stage intelligent volunteer tasks, and detect operational bottlenecks.
              </p>
            </div>
            <Button
              onClick={() => setOpenCreate(true)}
              className="bg-[#b9a8ec] hover:bg-[#9b88d8] text-[#0b1329] text-xs font-bold h-10 px-5 rounded-xl cursor-pointer"
            >
              Initialize New Event
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((e) => (
              <Card
                key={e.id}
                onClick={() => router.push(`/events/${e.id}`)}
                className="cursor-pointer border-[#1c294d] hover:border-[#b9a8ec]/50 hover:bg-[#131e38] transition-all p-7 space-y-5 group bg-[#131e38]/85 rounded-3xl shadow-xl hover:translate-y-[-2px]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1.5 flex-1">
                    <h3 className="text-lg font-bold text-[#f8fafc] group-hover:text-[#b9a8ec] transition-colors leading-snug">
                      {e.name}
                    </h3>
                    <Badge
                      variant="outline"
                      className="text-[10px] font-mono text-[#b9a8ec] border-[#b9a8ec]/30 bg-[#b9a8ec]/15 uppercase font-semibold"
                    >
                      Role: {e.role}
                    </Badge>
                  </div>
                  <span className="text-[10px] font-bold text-[#87a997] bg-[#87a997]/15 border border-[#87a997]/30 px-2.5 py-1 rounded-full flex-shrink-0">
                    {e.status}
                  </span>
                </div>

                <div className="space-y-2.5 text-xs text-[#94a3b8] pt-1">
                  <div className="flex items-center gap-2.5 bg-[#0b1329]/60 px-3 py-2 rounded-xl border border-[#1c294d]/60">
                    <Calendar className="w-4 h-4 text-[#b9a8ec] flex-shrink-0" />
                    <span className="font-medium text-slate-300">{formatDisplayDate(e.startDate)}</span>
                  </div>

                  {e.venue && (
                    <div className="flex items-center gap-2.5 bg-[#0b1329]/60 px-3 py-2 rounded-xl border border-[#1c294d]/60">
                      <MapPin className="w-4 h-4 text-[#87a997] flex-shrink-0" />
                      <span className="truncate">{e.venue}</span>
                    </div>
                  )}

                  {e.expectedParticipants && (
                    <div className="flex items-center gap-2.5 bg-[#0b1329]/60 px-3 py-2 rounded-xl border border-[#1c294d]/60">
                      <Users className="w-4 h-4 text-[#b9a8ec] flex-shrink-0" />
                      <span>{e.expectedParticipants} Expected Participants</span>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-[#1c294d] flex items-center justify-between text-xs text-[#b9a8ec] font-bold group-hover:text-[#9b88d8] transition-colors">
                  <span>Enter Operations Center</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Create Event Modal */}
        {openCreate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0b1329]/80 backdrop-blur-xl animate-in fade-in duration-200">
            <div className="w-full max-w-lg bg-[#131e38] border border-[#1c294d] rounded-3xl shadow-2xl p-7 space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-[#1c294d]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#b9a8ec]/15 border border-[#b9a8ec]/30 flex items-center justify-center text-[#b9a8ec]">
                    <Calendar className="w-4 h-4 text-[#b9a8ec]" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#f8fafc]">Create Event Workspace</h3>
                    <p className="text-[11px] text-[#94a3b8]">Initialize a collegiate event operations center</p>
                  </div>
                </div>
                <button
                  onClick={() => setOpenCreate(false)}
                  className="p-1.5 text-[#94a3b8] hover:text-[#f8fafc] hover:bg-[#1c294d] rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Live Demo Preset */}
              <div className="flex items-center justify-between bg-[#b9a8ec]/10 border border-[#b9a8ec]/25 p-3 rounded-xl text-xs">
                <span className="text-[#b9a8ec] font-medium">Live Demo Scene 1 Preset:</span>
                <button
                  type="button"
                  onClick={handleFillDemoValues}
                  className="px-3 py-1.5 rounded-lg bg-[#b9a8ec] hover:bg-[#9b88d8] text-[#0b1329] text-[11px] font-bold flex items-center gap-1.5 shadow-sm cursor-pointer transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Fill &ldquo;Bit N Build 2026&rdquo;
                </button>
              </div>

              <form onSubmit={handleCreateEvent} className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-semibold">Event Name *</label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Bit N Build 2026"
                    className="h-10 text-sm bg-[#0b1329] border-[#1c294d] text-[#f8fafc] rounded-xl"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-300 font-semibold">Venue Location</label>
                  <Input
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    placeholder="e.g., Main Auditorium & Lab 4"
                    className="h-10 text-sm bg-[#0b1329] border-[#1c294d] text-[#f8fafc] rounded-xl"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div className="space-y-1.5">
                    <label className="text-slate-300 font-semibold">Start Date *</label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="h-10 text-sm bg-[#0b1329] border-[#1c294d] text-[#f8fafc] rounded-xl"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-300 font-semibold">End Date *</label>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="h-10 text-sm bg-[#0b1329] border-[#1c294d] text-[#f8fafc] rounded-xl"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-300 font-semibold">Expected Attendees</label>
                  <Input
                    type="number"
                    value={expectedParticipants}
                    onChange={(e) => setExpectedParticipants(Number(e.target.value))}
                    className="h-10 text-sm bg-[#0b1329] border-[#1c294d] text-[#f8fafc] rounded-xl"
                    min={1}
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#1c294d]">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setOpenCreate(false)}
                    className="h-10 px-4 rounded-xl border-[#1c294d] text-slate-300 hover:bg-[#1c294d]"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={creating}
                    className="bg-[#b9a8ec] hover:bg-[#9b88d8] text-[#0b1329] font-bold h-10 px-5 rounded-xl shadow-lg shadow-[#b9a8ec]/20"
                  >
                    {creating && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
                    Launch Workspace
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
