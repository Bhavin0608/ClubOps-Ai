"use client";

import React from "react";
import { Compass, Sparkles, ArrowRight } from "lucide-react";

interface WelcomeCardFaceProps {
  onGetStarted: () => void;
}

export function WelcomeCardFace({ onGetStarted }: WelcomeCardFaceProps) {
  return (
    <div className="w-full flex flex-col justify-center items-center text-center p-6 sm:p-8 space-y-5 sm:space-y-6 my-auto">
      {/* Architectural Sculptural Monogram Emblem */}
      <div className="relative inline-flex items-center justify-center">
        {/* Warm Sandstone Ambient Ring */}
        <div className="absolute inset-0 rounded-2xl bg-[#CAAA98] blur-md opacity-35 animate-pulse-soft" />

        {/* Sculpted Glass Frame */}
        <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl p-[1px] bg-gradient-to-tr from-[#CAAA98] via-[#9A8678] to-[#202940] shadow-md shadow-[#202940]/10">
          <div className="w-full h-full rounded-[15px] bg-[#FAF8F5]/90 backdrop-blur-xl flex items-center justify-center border border-white shadow-inner">
            <Compass className="w-7 h-7 sm:w-8 sm:h-8 text-[#202940]" />
            <Sparkles className="w-3.5 h-3.5 text-[#9A8678] absolute -top-1 -right-1" />
          </div>
        </div>
      </div>

      {/* Brand Title & Headline */}
      <div className="space-y-2 max-w-sm mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#202940]">
          Welcome to <span className="font-light text-[#9A8678]">ClubOps AI</span>
        </h1>
        <p className="text-xs sm:text-sm text-[#4B4038]/85 font-normal leading-relaxed">
          Autonomous event orchestration, real-time risk intelligence, and command runbooks for collegiate hackathons.
        </p>
      </div>

      {/* Primary Call-to-Action: Get Started Button */}
      <div className="w-full max-w-xs pt-1 space-y-2.5 mx-auto">
        <button
          type="button"
          onClick={onGetStarted}
          className="group relative w-full h-11 sm:h-12 rounded-xl bg-[#202940] hover:bg-[#182033] border border-[#CAAA98]/35 text-[#FAF8F5] font-semibold text-sm shadow-md shadow-[#202940]/20 hover:shadow-xl hover:shadow-[#202940]/30 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer select-none overflow-hidden"
        >
          {/* Subtle Warm Sandstone Top Light Sheen */}
          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[#CAAA98]/70 to-transparent pointer-events-none" />

          <span className="tracking-wide">Get Started</span>
          <ArrowRight className="w-4 h-4 text-[#CAAA98] transition-transform duration-300 group-hover:translate-x-1" />
        </button>

        <p className="text-[10px] sm:text-[11px] text-[#9A8678] font-mono">
          Ready to enter? Click above to Get Started.
        </p>
      </div>
    </div>
  );
}
