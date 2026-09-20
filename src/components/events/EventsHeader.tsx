"use client";

import React from "react";
import { Compass, Plus, LogOut } from "lucide-react";

interface EventsHeaderProps {
  onOpenCreate: () => void;
  onLogout: () => void;
}

export function EventsHeader({ onOpenCreate, onLogout }: EventsHeaderProps) {
  return (
    <header className="flex items-center justify-between pb-6 border-b border-[#CAAA98]/30">
      {/* Brand Monogram & Subtitle */}
      <div className="flex items-center gap-3.5">
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 rounded-2xl bg-[#CAAA98] blur-xs opacity-40" />
          <div className="relative w-11 h-11 rounded-2xl p-[1px] bg-gradient-to-tr from-[#CAAA98] via-[#9A8678] to-[#202940] shadow-sm">
            <div className="w-full h-full rounded-[15px] bg-[#FAF8F5]/90 backdrop-blur-md flex items-center justify-center border border-white">
              <Compass className="w-5 h-5 text-[#202940]" />
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-[#202940]">
              ClubOps <span className="font-light text-[#9A8678]">AI</span>
            </h1>
            <span className="text-[10px] font-mono tracking-wider bg-[#202940]/08 text-[#202940] border border-[#202940]/20 px-2 py-0.5 rounded-full font-semibold">
              OS // 2.0
            </span>
          </div>
          <p className="text-xs text-[#9A8678] font-medium">
            Autonomous Operations Command Center
          </p>
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenCreate}
          className="group relative h-10 px-4 rounded-xl bg-[#202940] hover:bg-[#182033] text-[#FAF8F5] text-xs font-semibold shadow-md shadow-[#202940]/15 hover:shadow-lg hover:shadow-[#202940]/25 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex items-center gap-2 cursor-pointer border border-[#CAAA98]/35 overflow-hidden"
        >
          {/* Subtle Top Sheen */}
          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[#CAAA98]/60 to-transparent pointer-events-none" />
          <Plus className="w-4 h-4 text-[#CAAA98] transition-transform group-hover:rotate-90 duration-300" />
          <span>Initialize Workspace</span>
        </button>

        <button
          onClick={onLogout}
          title="Sign Out"
          className="h-10 w-10 rounded-xl glass-architectural-pill text-[#4B4038] hover:text-rose-600 hover:border-rose-300/60 transition-colors flex items-center justify-center cursor-pointer shadow-2xs"
          aria-label="Sign Out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
