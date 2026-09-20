"use client";

import React from "react";
import { ShieldCheck, Cpu, Activity } from "lucide-react";

export function AuthFeatureHighlights() {
  const highlights = [
    {
      icon: ShieldCheck,
      label: "Risk Engine",
      color: "text-[#4B4038] bg-[#CAAA98]/20 border-[#CAAA98]/45",
    },
    {
      icon: Cpu,
      label: "Auto Runbooks",
      color: "text-[#202940] bg-[#202940]/06 border-[#202940]/20",
    },
    {
      icon: Activity,
      label: "Live Dispatch",
      color: "text-[#4B4038] bg-[#9A8678]/15 border-[#9A8678]/35",
    },
  ];

  return (
    <div className="pt-2 border-t border-[#CAAA98]/30 flex items-center justify-between gap-1.5">
      {highlights.map((item, idx) => {
        const Icon = item.icon;
        return (
          <div
            key={idx}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[11px] font-semibold backdrop-blur-md transition-all duration-200 hover:scale-[1.02] ${item.color}`}
          >
            <Icon className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{item.label}</span>
          </div>
        );
      })}
    </div>
  );
}
