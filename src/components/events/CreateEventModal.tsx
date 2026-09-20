"use client";

import React from "react";
import { Calendar, X, Sparkles, Loader2, ArrowRight } from "lucide-react";

interface CreateEventModalProps {
  open: boolean;
  onClose: () => void;
  name: string;
  setName: (name: string) => void;
  venue: string;
  setVenue: (venue: string) => void;
  startDate: string;
  setStartDate: (date: string) => void;
  endDate: string;
  setEndDate: (date: string) => void;
  expectedParticipants: number;
  setExpectedParticipants: (num: number) => void;
  onFillDemo: () => void;
  onSubmit: (e: React.FormEvent) => void;
  creating: boolean;
}

export function CreateEventModal({
  open,
  onClose,
  name,
  setName,
  venue,
  setVenue,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  expectedParticipants,
  setExpectedParticipants,
  onFillDemo,
  onSubmit,
  creating,
}: CreateEventModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#202940]/40 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg glass-architectural rounded-[28px] shadow-2xl p-7 sm:p-8 space-y-5 border border-[#CAAA98]/50 animate-in zoom-in-95 duration-200">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-[#CAAA98]/30">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#CAAA98]/25 border border-[#CAAA98]/50 flex items-center justify-center text-[#202940]">
              <Calendar className="w-5 h-5 text-[#202940]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#202940]">Create Event Workspace</h3>
              <p className="text-[11px] text-[#9A8678]">Initialize a collegiate operations command center</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#9A8678] hover:text-[#202940] hover:bg-[#CAAA98]/20 rounded-lg transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Demo Scene 1 Preset Banner */}
        <div className="flex items-center justify-between bg-[#CAAA98]/20 border border-[#CAAA98]/45 p-3 rounded-2xl text-xs">
          <span className="text-[#4B4038] font-semibold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#202940]" />
            Demo Fast Pass:
          </span>
          <button
            type="button"
            onClick={onFillDemo}
            className="px-3 py-1.5 rounded-xl bg-[#202940] hover:bg-[#182033] text-[#FAF8F5] text-[11px] font-semibold flex items-center gap-1.5 shadow-sm cursor-pointer transition-colors border border-[#CAAA98]/30"
          >
            Fill &ldquo;Bit N Build 2026&rdquo;
          </button>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} className="space-y-4 text-xs">
          <div className="space-y-1.5">
            <label className="text-[#4B4038] font-semibold">Event Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Bit N Build 2026"
              className="w-full h-10 px-3.5 text-sm rounded-xl glass-architectural-input placeholder:text-[#9A8678]/70 font-medium"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[#4B4038] font-semibold">Venue Location</label>
            <input
              type="text"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              placeholder="e.g., Main Auditorium & Innovation Hall"
              className="w-full h-10 px-3.5 text-sm rounded-xl glass-architectural-input placeholder:text-[#9A8678]/70 font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label className="text-[#4B4038] font-semibold">Start Date *</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full h-10 px-3 text-sm rounded-xl glass-architectural-input font-medium"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[#4B4038] font-semibold">End Date *</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full h-10 px-3 text-sm rounded-xl glass-architectural-input font-medium"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[#4B4038] font-semibold">Expected Attendees</label>
            <input
              type="number"
              value={expectedParticipants}
              onChange={(e) => setExpectedParticipants(Number(e.target.value))}
              className="w-full h-10 px-3.5 text-sm rounded-xl glass-architectural-input placeholder:text-[#9A8678]/70 font-medium"
              min={1}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#CAAA98]/30">
            <button
              type="button"
              onClick={onClose}
              className="h-10 px-4 rounded-xl glass-architectural-pill text-xs font-semibold text-[#4B4038] hover:text-[#202940] transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={creating}
              className="group relative h-10 px-5 rounded-xl bg-[#202940] hover:bg-[#182033] text-[#FAF8F5] text-xs font-semibold shadow-md shadow-[#202940]/15 hover:shadow-lg hover:shadow-[#202940]/25 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60 disabled:pointer-events-none border border-[#CAAA98]/35 overflow-hidden"
            >
              <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[#CAAA98]/60 to-transparent pointer-events-none" />
              {creating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#CAAA98]" />
                  <span>Deploying Workspace...</span>
                </>
              ) : (
                <>
                  <span>Launch Workspace</span>
                  <ArrowRight className="w-4 h-4 text-[#CAAA98] transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
