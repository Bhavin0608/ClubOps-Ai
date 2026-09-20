"use client";

import React from "react";

export function AuthBackground() {
  return (
    <div
      className="fixed inset-0 overflow-hidden pointer-events-none select-none z-0 bg-[#FAF8F5]"
      aria-hidden="true"
    >
      {/* Editorial Silk / Linen Base */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#FAF8F5] via-[#F4EFEA] to-[#ECE5DE]" />

      {/* Floating Ambient Bloom 1: Warm Sandstone (#CAAA98) */}
      <div
        className="absolute -top-[12%] -left-[10%] w-[650px] h-[650px] rounded-full bg-[#CAAA98]/30 blur-[110px] animate-float-slow"
        style={{ willChange: "transform" }}
      />

      {/* Floating Ambient Bloom 2: Deep Midnight Navy (#202940) */}
      <div
        className="absolute -bottom-[15%] -right-[8%] w-[600px] h-[600px] rounded-full bg-[#202940]/12 blur-[120px] animate-float-reverse"
        style={{ willChange: "transform" }}
      />

      {/* Floating Ambient Bloom 3: Muted Earth Taupe (#9A8678) */}
      <div
        className="absolute top-[25%] left-[50%] -translate-x-1/2 w-[520px] h-[520px] rounded-full bg-[#9A8678]/22 blur-[105px] animate-pulse-soft"
        style={{ willChange: "transform" }}
      />

      {/* Floating Accent Bloom 4: Deep Espresso Ambient Contrast (#4B4038) */}
      <div
        className="absolute bottom-[20%] left-[10%] w-[420px] h-[420px] rounded-full bg-[#4B4038]/08 blur-[95px] animate-float-slow"
        style={{ willChange: "transform" }}
      />

      {/* Architectural Fine Hairline Grid */}
      <div
        className="absolute inset-0 opacity-[0.22]"
        style={{
          backgroundImage: `linear-gradient(to right, #9A8678 1px, transparent 1px), linear-gradient(to bottom, #9A8678 1px, transparent 1px)`,
          backgroundSize: "64px 64px",
        }}
      />

      {/* Editorial Corner Crosshairs */}
      <div className="absolute top-8 left-8 text-[#9A8678]/40 font-mono text-xs select-none">
        + 37°46&apos;N // 122°25&apos;W
      </div>
      <div className="absolute top-8 right-8 text-[#9A8678]/40 font-mono text-xs select-none">
        [ SYSTEM : SECURE ]
      </div>
      <div className="absolute bottom-8 left-8 text-[#9A8678]/40 font-mono text-xs select-none">
        EDITION // 2026.04
      </div>
      <div className="absolute bottom-8 right-8 text-[#9A8678]/40 font-mono text-xs select-none">
        + CLUBOPS.STUDIO
      </div>

      {/* Architectural Concentric Thin Orbit Lines */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[840px] h-[840px] rounded-full border border-[#CAAA98]/30 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1120px] h-[1120px] rounded-full border border-[#9A8678]/20 pointer-events-none" />
    </div>
  );
}
