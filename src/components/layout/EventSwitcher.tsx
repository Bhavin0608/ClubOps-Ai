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
        className="flex items-center justify-between w-full px-3 py-2 text-left rounded-xl bg-white/85 border border-[#CAAA98]/60 hover:border-[#CAAA98] text-[#202940] shadow-xs transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="w-6 h-6 rounded-lg bg-[#CAAA98]/25 border border-[#CAAA98]/50 flex items-center justify-center text-[#202940] flex-shrink-0 font-bold">
            <Calendar className="w-3.5 h-3.5" />
          </div>
          <div className="truncate">
            <div className="text-xs font-bold truncate text-[#202940]">
              {currentEvent?.name || "Select Event"}
            </div>
            <div className="text-[10px] text-[#9A8678] flex items-center gap-1 font-mono">
              <span>{currentEvent?.role || "ORGANIZER"}</span>
              <span>·</span>
              <span className="text-emerald-700 font-semibold">{currentEvent?.status || "ACTIVE"}</span>
            </div>
          </div>
        </div>
        <ChevronDown className="w-4 h-4 text-[#9A8678] flex-shrink-0 ml-1" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 right-0 mt-1 z-50 rounded-xl bg-white/95 border border-[#CAAA98]/60 shadow-xl overflow-hidden py-1 backdrop-blur-2xl">
            <div className="max-h-60 overflow-y-auto">
              {events.map((e) => (
                <button
                  key={e.id}
                  onClick={() => {
                    setOpen(false);
                    router.push(`/events/${e.id}`);
                  }}
                  className={cn(
                    "w-full px-3 py-2 text-left text-xs flex items-center justify-between hover:bg-[#CAAA98]/20 transition-colors cursor-pointer",
                    e.id === currentEventId ? "text-[#202940] font-bold bg-[#CAAA98]/25" : "text-[#4B4038]"
                  )}
                >
                  <div className="truncate pr-2">
                    <div className="truncate font-semibold">{e.name}</div>
                    <div className="text-[10px] text-[#9A8678]">{e.role}</div>
                  </div>
                  {e.id === currentEventId && <Check className="w-3.5 h-3.5 text-[#202940] flex-shrink-0 font-bold" />}
                </button>
              ))}
            </div>

            <div className="border-t border-[#CAAA98]/30 pt-1 mt-1">
              <button
                onClick={() => {
                  setOpen(false);
                  router.push("/events");
                }}
                className="w-full px-3 py-1.5 text-left text-xs text-[#202940] hover:bg-[#CAAA98]/20 flex items-center gap-1.5 font-bold transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-[#202940]" />
                <span>Create or Switch Event</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
