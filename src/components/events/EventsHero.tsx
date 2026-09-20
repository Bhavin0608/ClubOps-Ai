"use client";

import React from "react";
import { Activity, ShieldCheck, Cpu } from "lucide-react";

interface EventsHeroProps {
  totalEvents: number;
}

export function EventsHero({ totalEvents }: EventsHeroProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#202940]">
          Active Event Workspaces
        </h2>
        <p className="text-sm text-[#4B4038]/85 max-w-2xl leading-relaxed">
          Select an operational command center below to monitor live risk intelligence, coordinate autonomous runbooks, or synthesize real-time attendee signals.
        </p>
      </div>

      {/* Operational Telemetry Chips */}
      <div className="flex flex-wrap items-center gap-2.5 pt-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass-architectural-pill border border-[#CAAA98]/50 text-xs font-semibold text-[#4B4038] shadow-2xs">
          <Activity className="w-3.5 h-3.5 text-[#202940]" />
          <span>{totalEvents} {totalEvents === 1 ? "Workspace" : "Workspaces"} Online</span>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass-architectural-pill border border-[#9A8678]/40 text-xs font-semibold text-[#4B4038] shadow-2xs">
          <Cpu className="w-3.5 h-3.5 text-[#9A8678]" />
          <span>Gemini 2.0 Risk Engine Ready</span>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass-architectural-pill border border-emerald-300/60 bg-emerald-50/40 text-xs font-semibold text-emerald-800 shadow-2xs">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Zero-Trust Operator Session</span>
        </div>
      </div>
    </div>
  );
}
