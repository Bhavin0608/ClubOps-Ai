"use client";

import React from "react";
import { Calendar, Plus } from "lucide-react";

interface EventsEmptyStateProps {
  onOpenCreate: () => void;
}

export function EventsEmptyState({ onOpenCreate }: EventsEmptyStateProps) {
  return (
    <div className="text-center py-20 px-6 rounded-[28px] border border-dashed border-[#CAAA98]/60 space-y-6 glass-architectural">
      <div className="w-16 h-16 rounded-2xl bg-[#CAAA98]/20 border border-[#CAAA98]/40 flex items-center justify-center mx-auto text-[#202940] shadow-sm">
        <Calendar className="w-8 h-8 text-[#202940]" />
      </div>

      <div className="space-y-2">
        <h3 className="text-xl font-bold text-[#202940]">
          No Active Event Workspaces
        </h3>
        <p className="text-xs sm:text-sm text-[#4B4038]/85 max-w-md mx-auto leading-relaxed">
          Initialize your first collegiate event workspace to deploy automated runbooks, organize volunteer teams, and detect operational risks in real-time.
        </p>
      </div>

      <button
        onClick={onOpenCreate}
        className="group relative h-11 px-6 rounded-xl bg-[#202940] hover:bg-[#182033] text-[#FAF8F5] text-xs font-semibold shadow-md shadow-[#202940]/15 hover:shadow-xl hover:shadow-[#202940]/25 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 inline-flex items-center gap-2 cursor-pointer border border-[#CAAA98]/35 overflow-hidden"
      >
        <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[#CAAA98]/60 to-transparent pointer-events-none" />
        <Plus className="w-4 h-4 text-[#CAAA98] transition-transform group-hover:rotate-90 duration-300" />
        <span>Initialize First Event</span>
      </button>
    </div>
  );
}
