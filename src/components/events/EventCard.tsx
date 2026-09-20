"use client";

import React, { useRef, useState } from "react";
import { Calendar, MapPin, Users, ArrowRight } from "lucide-react";
import { formatDisplayDate } from "@/lib/dates";

export interface EventItem {
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

interface EventCardProps {
  event: EventItem;
  onSelect: () => void;
}

export function EventCard({ event, onSelect }: EventCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0, isHovered: false });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const normX = (x - centerX) / centerX;
    const normY = (y - centerY) / centerY;

    const maxTilt = 7; // degrees
    setTilt({
      rotateX: -normY * maxTilt,
      rotateY: normX * maxTilt,
      isHovered: true,
    });
  };

  const handleMouseLeave = () => {
    setTilt({
      rotateX: 0,
      rotateY: 0,
      isHovered: false,
    });
  };

  return (
    <div
      style={{ perspective: 1000 }}
      className="relative cursor-pointer select-none"
      onClick={onSelect}
    >
      {/* Main Glassmorphic Card Container */}
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          transform: tilt.isHovered
            ? `rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg) translateZ(6px)`
            : "rotateX(0deg) rotateY(0deg) translateZ(0px)",
          transformStyle: "preserve-3d",
          transition: tilt.isHovered
            ? "transform 0.08s ease-out, box-shadow 0.08s ease-out"
            : "transform 0.5s cubic-bezier(0.23, 1, 0.32, 1), box-shadow 0.5s ease",
          boxShadow: tilt.isHovered
            ? `${-tilt.rotateY * 2}px ${tilt.rotateX * 2 + 25}px 60px -10px rgba(32, 41, 64, 0.16)`
            : "0 25px 55px -12px rgba(32, 41, 64, 0.1), 0 1px 3px rgba(75, 64, 56, 0.05)",
        }}
        className="group relative rounded-[26px] glass-architectural overflow-hidden p-6 sm:p-7 space-y-5 transition-colors"
      >

        {/* Top 4-Tone Accent Ribbon */}
        <div className="absolute top-0 inset-x-0 h-1 flex">
          <div className="w-1/3 bg-[#202940]" />
          <div className="w-1/4 bg-[#4B4038]" />
          <div className="w-1/4 bg-[#9A8678]" />
          <div className="w-1/6 bg-[#CAAA98]" />
        </div>

        {/* Header with Title and Status */}
        <div className="flex items-start justify-between gap-3 pt-1">
          <div className="space-y-1.5 flex-1">
            <h3 className="text-lg font-bold text-[#202940] group-hover:text-[#4B4038] transition-colors leading-snug">
              {event.name}
            </h3>
            <span className="inline-block text-[10px] font-mono uppercase tracking-wider text-[#202940] bg-[#202940]/08 border border-[#202940]/20 px-2.5 py-0.5 rounded-md font-semibold">
              Role: {event.role}
            </span>
          </div>

          <span className="text-[10px] font-bold text-[#4B4038] bg-[#CAAA98]/25 border border-[#CAAA98]/50 px-2.5 py-1 rounded-full flex-shrink-0 tracking-wide uppercase font-mono">
            {event.status}
          </span>
        </div>

        {/* Metadata Details Rows */}
        <div className="space-y-2 text-xs text-[#4B4038]/85 pt-1">
          <div className="flex items-center gap-2.5 bg-white/60 px-3 py-2 rounded-xl border border-[#CAAA98]/30">
            <Calendar className="w-4 h-4 text-[#9A8678] flex-shrink-0" />
            <span className="font-medium text-[#4B4038]">{formatDisplayDate(event.startDate)}</span>
          </div>

          {event.venue && (
            <div className="flex items-center gap-2.5 bg-white/60 px-3 py-2 rounded-xl border border-[#CAAA98]/30">
              <MapPin className="w-4 h-4 text-[#CAAA98] flex-shrink-0" />
              <span className="truncate font-medium text-[#4B4038]">{event.venue}</span>
            </div>
          )}

          {event.expectedParticipants && (
            <div className="flex items-center gap-2.5 bg-white/60 px-3 py-2 rounded-xl border border-[#CAAA98]/30">
              <Users className="w-4 h-4 text-[#202940] flex-shrink-0" />
              <span className="font-medium text-[#4B4038]">{event.expectedParticipants} Expected Participants</span>
            </div>
          )}
        </div>

        {/* Footer Link Strip with Animated Arrow */}
        <div className="pt-3 border-t border-[#CAAA98]/30 flex items-center justify-between text-xs text-[#202940] font-bold">
          <span>Enter Operations Center</span>
          <ArrowRight className="w-4 h-4 text-[#CAAA98] transition-transform group-hover:translate-x-1.5" />
        </div>
      </div>
    </div>
  );
}
