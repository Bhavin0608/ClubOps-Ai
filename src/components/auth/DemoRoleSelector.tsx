"use client";

import React from "react";
import { Sparkles, Check, UserCheck, ShieldCheck } from "lucide-react";

interface DemoRoleSelectorProps {
  activeEmail: string;
  onSelect: (email: string, role: string) => void;
}

export function DemoRoleSelector({ activeEmail, onSelect }: DemoRoleSelectorProps) {
  const roles = [
    {
      name: "Aman Verma",
      roleTitle: "Lead Organizer",
      tag: "Admin & Executive",
      email: "organizer@clubops.demo",
      icon: ShieldCheck,
      badgeColor: "bg-[#202940]/08 text-[#202940] border-[#202940]/25",
      activeRing: "border-[#202940] ring-2 ring-[#202940]/20 bg-[#FAF8F5]",
    },
    {
      name: "Rahul Mehta",
      roleTitle: "Event Volunteer",
      tag: "Field Operations",
      email: "rahul@clubops.demo",
      icon: UserCheck,
      badgeColor: "bg-[#CAAA98]/25 text-[#4B4038] border-[#CAAA98]/50",
      activeRing: "border-[#9A8678] ring-2 ring-[#9A8678]/25 bg-[#FAF8F5]",
    },
  ];

  return (
    <div className="rounded-xl bg-[#FAF8F5]/70 border border-[#CAAA98]/45 p-2 sm:p-2.5 space-y-1.5 backdrop-blur-md transition-all shadow-2xs">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-[#4B4038] flex items-center gap-1.5 text-[11px] sm:text-xs">
          <Sparkles className="w-3 h-3 text-[#202940] animate-spin" style={{ animationDuration: "12s" }} />
          1-Click Demo Profiles
        </span>
        <span className="text-[9px] uppercase font-mono tracking-wider text-[#202940] bg-[#CAAA98]/30 border border-[#CAAA98]/50 px-1.5 py-0.5 rounded font-semibold">
          Fast Pass
        </span>
      </div>

      <div className="grid grid-cols-2 gap-1.5">
        {roles.map((role) => {
          const isSelected = activeEmail === role.email;
          const Icon = role.icon;

          return (
            <button
              key={role.email}
              type="button"
              onClick={() => onSelect(role.email, role.roleTitle)}
              className={`relative flex flex-col items-start p-2 rounded-lg border text-left cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xs ${
                isSelected
                  ? `${role.activeRing} shadow-2xs`
                  : "border-[#CAAA98]/40 bg-white/75 hover:border-[#9A8678] hover:bg-white"
              }`}
            >
              {isSelected && (
                <div className="absolute top-1.5 right-1.5 w-3.5 h-3.5 rounded-full bg-[#202940] text-[#FAF8F5] flex items-center justify-center">
                  <Check className="w-2 h-2 stroke-[3]" />
                </div>
              )}

              <div className="flex items-center gap-1 mb-0.5">
                <Icon className={`w-3 h-3 ${isSelected ? "text-[#202940]" : "text-[#9A8678]"}`} />
                <span className="font-bold text-[11px] sm:text-xs text-[#4B4038] tracking-tight">
                  {role.name}
                </span>
              </div>

              <div className="flex items-center gap-1 mt-0.5">
                <span className={`text-[9px] font-medium px-1 py-0.2 rounded border ${role.badgeColor}`}>
                  {role.roleTitle}
                </span>
                <span className="text-[8px] text-[#9A8678] font-mono hidden sm:inline">
                  {role.tag}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
