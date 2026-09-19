"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Plus, Calendar, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface EventItem {
  id: string;
  name: string;
  role: string;
  status: string;
}

export function EventSwitcher({ currentEventId }: { currentEventId?: string }) {
  const router = useRouter();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [open, setOpen] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<EventItem | null>(null);

  useEffect(() => {
    fetch("/api/events")
      .then((res) => (res.ok ? res.json() : []))
      .then((data: EventItem[]) => {
        setEvents(data);
        const match = data.find((e) => e.id === currentEventId);
        if (match) setCurrentEvent(match);
        else if (data.length > 0 && !currentEventId) {
          setCurrentEvent(data[0]);
        }
      })
      .catch(() => {});
  }, [currentEventId]);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full px-3 py-2 text-left rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 transition-colors"
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="w-6 h-6 rounded bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 flex-shrink-0">
            <Calendar className="w-3.5 h-3.5" />
          </div>
          <div className="truncate">
            <div className="text-xs font-semibold truncate text-white">
              {currentEvent?.name || "Select Event"}
            </div>
            <div className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
              <span>{currentEvent?.role || "ORGANIZER"}</span>
              <span>·</span>
              <span className="text-blue-400">{currentEvent?.status || "ACTIVE"}</span>
            </div>
          </div>
        </div>
        <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0 ml-1" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 right-0 mt-1 z-50 rounded-lg bg-slate-900 border border-slate-800 shadow-xl overflow-hidden py-1">
            <div className="max-h-60 overflow-y-auto">
              {events.map((e) => (
                <button
                  key={e.id}
                  onClick={() => {
                    setOpen(false);
                    router.push(`/events/${e.id}`);
                  }}
                  className={cn(
                    "w-full px-3 py-2 text-left text-xs flex items-center justify-between hover:bg-slate-800 transition-colors",
                    e.id === currentEventId ? "text-blue-400 font-medium bg-blue-950/30" : "text-slate-300"
                  )}
                >
                  <div className="truncate pr-2">
                    <div className="truncate font-medium">{e.name}</div>
                    <div className="text-[10px] text-slate-400">{e.role}</div>
                  </div>
                  {e.id === currentEventId && <Check className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />}
                </button>
              ))}
            </div>

            <div className="border-t border-slate-800 pt-1 mt-1">
              <button
                onClick={() => {
                  setOpen(false);
                  router.push("/events");
                }}
                className="w-full px-3 py-1.5 text-left text-xs text-blue-400 hover:bg-slate-800 flex items-center gap-1.5 font-medium transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create or Switch Event</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
