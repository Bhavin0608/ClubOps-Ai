"use client";

import React from "react";
import { UserPlus, Sparkles } from "lucide-react";

export function RegisterBrandHeader() {
  return (
    <div className="text-center space-y-3.5">
      {/* Sculptural Monogram Emblem */}
      <div className="relative inline-flex items-center justify-center">
        {/* Warm Sandstone Ambient Ring */}
        <div className="absolute inset-0 rounded-2xl bg-[#CAAA98] blur-md opacity-40 animate-pulse-soft" />

        {/* Sculpted Glass Frame */}
        <div className="relative w-15 h-15 rounded-2xl p-[1px] bg-gradient-to-tr from-[#CAAA98] via-[#9A8678] to-[#202940] shadow-md shadow-[#202940]/10">
          <div className="w-full h-full rounded-[15px] bg-[#FAF8F5]/90 backdrop-blur-xl flex items-center justify-center border border-white shadow-inner">
            <UserPlus className="w-7 h-7 text-[#202940]" />
            <Sparkles className="w-3.5 h-3.5 text-[#9A8678] absolute -top-1 -right-1" />
          </div>
        </div>
      </div>

      {/* Brand Title in Midnight Navy & Espresso */}
      <div className="space-y-1.5">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#202940]">
          Create Account <span className="font-light text-[#9A8678]">// AI</span>
        </h1>
        <p className="text-xs sm:text-sm text-[#4B4038]/85 max-w-xs mx-auto font-normal leading-relaxed">
          Enroll as an event organizer or volunteer operations staff
        </p>
      </div>

      {/* Architectural Status Pill */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full glass-architectural-pill border border-[#CAAA98]/60 shadow-2xs">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#9A8678] opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#202940]" />
        </span>
        <span className="text-[11px] font-mono tracking-wider text-[#4B4038] uppercase">
          Enrollment Open // v2.0
        </span>
      </div>
    </div>
  );
}
