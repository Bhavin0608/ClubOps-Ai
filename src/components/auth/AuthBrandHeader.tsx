"use client";

import React from "react";
import { Compass, Sparkles } from "lucide-react";

export function AuthBrandHeader() {
  return (
    <div className="text-center space-y-2 sm:space-y-2.5">
      {/* Architectural Sculptural Monogram Emblem */}
      <div className="relative inline-flex items-center justify-center">
        {/* Warm Sandstone Ambient Ring */}
        <div className="absolute inset-0 rounded-xl bg-[#CAAA98] blur-md opacity-35 animate-pulse-soft" />

        {/* Sculpted Glass Frame */}
        <div className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-xl p-[1px] bg-gradient-to-tr from-[#CAAA98] via-[#9A8678] to-[#202940] shadow-sm shadow-[#202940]/10">
          <div className="w-full h-full rounded-[11px] bg-[#FAF8F5]/90 backdrop-blur-xl flex items-center justify-center border border-white shadow-inner">
            <Compass className="w-5 h-5 sm:w-6 sm:h-6 text-[#202940]" />
            <Sparkles className="w-3 h-3 text-[#9A8678] absolute -top-0.5 -right-0.5" />
          </div>
        </div>
      </div>

      {/* Brand Title in Deep Midnight Navy & Espresso */}
      <div className="space-y-0.5 sm:space-y-1">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#202940]">
          ClubOps <span className="font-light text-[#9A8678]">AI</span>
        </h1>
        <p className="text-xs text-[#4B4038]/85 max-w-xs mx-auto font-normal leading-snug">
          Autonomous event orchestration and intelligence platform
        </p>
      </div>

      {/* Architectural Status Pill */}
      <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full glass-architectural-pill border border-[#CAAA98]/60 shadow-2xs">
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#9A8678] opacity-75" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#202940]" />
        </span>
        <span className="text-[10px] font-mono tracking-wider text-[#4B4038] uppercase">
          Engine Active // v2.0
        </span>
      </div>
    </div>
  );
}
