"use client";

import React from "react";

interface ConicalBlackoutBeamProps {
  active: boolean;
  origin: { x: number; y: number } | null;
}

export function ConicalBlackoutBeam({ active, origin }: ConicalBlackoutBeamProps) {
  if (!active || !origin) return null;

  const apexX = origin.x;
  const apexY = origin.y;

  return (
    <div
      className="fixed inset-0 z-45 pointer-events-none overflow-hidden select-none"
      aria-hidden="true"
    >
      {/* Conical Lamp Spotlight Beam shooting rightward from the arrow */}
      <div
        className="absolute animate-lamp-cone pointer-events-none"
        style={{
          left: `${apexX}px`,
          top: `${apexY}px`,
          width: "140vw",
          height: "140vh",
          marginTop: "-70vh",
          clipPath: "polygon(0% 50%, 100% 0%, 100% 100%)",
          background: "linear-gradient(to right, rgba(11, 19, 41, 0.95) 0%, #000000 65%, #000000 100%)",
        }}
      >
        {/* Luminous upper ray edge simulating lamp light cone */}
        <div
          className="absolute left-0 w-full h-[2px] bg-gradient-to-r from-[#CAAA98] via-[#dfc4b3]/60 to-transparent"
          style={{
            top: "50%",
            transform: "rotate(-26deg)",
            transformOrigin: "left center",
          }}
        />

        {/* Luminous lower ray edge simulating lamp light cone */}
        <div
          className="absolute left-0 w-full h-[2px] bg-gradient-to-r from-[#CAAA98] via-[#dfc4b3]/60 to-transparent"
          style={{
            top: "50%",
            transform: "rotate(26deg)",
            transformOrigin: "left center",
          }}
        />

        {/* Arrow Aperture Glow */}
        <div
          className="absolute top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#CAAA98] blur-xs opacity-90"
        />
      </div>

      {/* Global Blackout Curtain completing the transition smoothly */}
      <div className="absolute inset-0 bg-[#0b1329] animate-blackout-wipe pointer-events-none" />
    </div>
  );
}
