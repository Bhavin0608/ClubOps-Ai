"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AuthBackground } from "@/components/auth/AuthBackground";
import { EventsHeader } from "@/components/events/EventsHeader";
import { EventsHero } from "@/components/events/EventsHero";
import { EventCard, EventItem } from "@/components/events/EventCard";
import { EventsEmptyState } from "@/components/events/EventsEmptyState";
import { CreateEventModal } from "@/components/events/CreateEventModal";

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
    toast.info("Configured demo fields for Bit N Build 2026");
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

      toast.success(`Event "${name}" initialized! Entering workspace...`);
      setOpenCreate(false);
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
    <div className="relative min-h-screen bg-[#FAF8F5] text-[#4B4038] selection:bg-[#CAAA98]/40 selection:text-[#202940] animate-portal-enter">
      {/* Editorial Architectural Ambient Background */}
      <AuthBackground />

      {/* Main Content Container */}
      <div className="relative z-10 max-w-6xl mx-auto py-8 sm:py-12 px-6 sm:px-10 lg:px-12 space-y-10">
        {/* Top Header Bar */}
        <EventsHeader
          onOpenCreate={() => setOpenCreate(true)}
          onLogout={handleLogout}
        />

        {/* Hero Headline & Telemetry Badges */}
        <EventsHero totalEvents={events.length} />

        {/* Events Grid / State Views */}
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center text-[#9A8678] text-xs space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#202940]" />
            <span className="text-sm font-semibold text-[#4B4038]">
              Loading operational command centers...
            </span>
          </div>
        ) : events.length === 0 ? (
          <EventsEmptyState onOpenCreate={() => setOpenCreate(true)} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((e) => (
              <EventCard
                key={e.id}
                event={e}
                onSelect={() => router.push(`/events/${e.id}`)}
              />
            ))}
          </div>
        )}

        {/* Create Event Workspace Modal */}
        <CreateEventModal
          open={openCreate}
          onClose={() => setOpenCreate(false)}
          name={name}
          setName={setName}
          venue={venue}
          setVenue={setVenue}
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
          expectedParticipants={expectedParticipants}
          setExpectedParticipants={setExpectedParticipants}
          onFillDemo={handleFillDemoValues}
          onSubmit={handleCreateEvent}
          creating={creating}
        />
      </div>
    </div>
  );
}
