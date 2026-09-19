"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Plus, Users, MapPin, ArrowRight, Shield, Sparkles, Loader2, X } from "lucide-react";
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
    setVenue("Main Auditorium & Labs");
    const d = new Date();
    d.setDate(d.getDate() + 14);
    setStartDate(d.toISOString().split("T")[0]);
    d.setDate(d.getDate() + 2);
    setEndDate(d.toISOString().split("T")[0]);
    setExpectedParticipants(500);
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !startDate || !endDate) return;

    setCreating(true);
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          venue: venue || undefined,
          startDate: new Date(startDate).toISOString(),
          endDate: new Date(endDate).toISOString(),
          expectedParticipants: Number(expectedParticipants) || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create event");

      toast.success(`Event "${name}" created! Entering workspace...`);
      router.push(`/events/${data.event.id}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to create event");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 p-6 md:p-12">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">Your Event Workspaces</h1>
              <p className="text-xs text-slate-400">Select an event or initialize a new command center</p>
            </div>
          </div>

          <Button
            onClick={() => setOpenCreate(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white gap-2 text-xs font-semibold h-9 shadow-lg shadow-blue-500/20"
          >
            <Plus className="w-4 h-4" />
            Create Event (Scene 1)
          </Button>
        </div>

        {/* Events Grid */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 text-xs">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500 mb-2" />
            <span>Loading workspaces...</span>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-20 rounded-2xl border border-dashed border-slate-800 space-y-4">
            <Calendar className="w-10 h-10 text-slate-500 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-white">No events configured yet</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Create your first event or load the seeded &ldquo;TechNova 2026&rdquo; hackathon event.
              </p>
            </div>
            <Button
              onClick={() => setOpenCreate(true)}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
            >
              Create New Event
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {events.map((e) => (
              <Card
                key={e.id}
                onClick={() => router.push(`/events/${e.id}`)}
                className="cursor-pointer border-slate-800 hover:border-blue-500/50 hover:bg-slate-900/80 transition-all p-5 space-y-4 group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-white group-hover:text-blue-300 transition-colors">
                      {e.name}
                    </h3>
                    <Badge variant="outline" className="text-[10px] font-mono text-blue-300 border-blue-800/60 bg-blue-950/40">
                      Role: {e.role}
                    </Badge>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-full">
                    {e.status}
                  </span>
                </div>

                <div className="space-y-2 text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span>{formatDisplayDate(e.startDate)}</span>
                  </div>

                  {e.venue && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      <span className="truncate">{e.venue}</span>
                    </div>
                  )}

                  {e.expectedParticipants && (
                    <div className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-slate-500" />
                      <span>{e.expectedParticipants} Expected Participants</span>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-blue-400 font-medium">
                  <span>Enter Operations Center</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Create Event Modal */}
        {openCreate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-400" />
                  <h3 className="text-base font-semibold text-white">Create New Event Workspace</h3>
                </div>
                <button onClick={() => setOpenCreate(false)} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center justify-between bg-blue-950/30 border border-blue-800/40 p-2.5 rounded-lg text-xs">
                <span className="text-blue-300">Live Demo Scene 1 Preset:</span>
                <button
                  type="button"
                  onClick={handleFillDemoValues}
                  className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-semibold flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  Fill &ldquo;Bit N Build 2026&rdquo;
                </button>
              </div>

              <form onSubmit={handleCreateEvent} className="space-y-3.5 text-xs">
                <div className="space-y-1">
                  <label className="text-slate-300 font-medium">Event Name *</label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Bit N Build 2026"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-medium">Venue</label>
                  <Input
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    placeholder="e.g., Main Auditorium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-slate-300 font-medium">Start Date *</label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-300 font-medium">End Date *</label>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-medium">Expected Participants</label>
                  <Input
                    type="number"
                    value={expectedParticipants}
                    onChange={(e) => setExpectedParticipants(Number(e.target.value))}
                    min={1}
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                  <Button type="button" variant="outline" size="sm" onClick={() => setOpenCreate(false)}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={creating}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-semibold"
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
