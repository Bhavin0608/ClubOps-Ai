"use client";

import React from "react";
import { useRouter, usePathname } from "next/navigation";
import { Sparkles, LogOut, UserCheck, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface HeaderProps {
  title?: string;
  role?: "ORGANIZER" | "VOLUNTEER";
  userName?: string;
  onOpenAssistant?: () => void;
}

const PAGE_TITLES: Record<string, string> = {
  tasks: "Tasks & Workflows",
  deadlines: "Deadlines & Milestones",
  volunteers: "Volunteer Workload & Roster",
  meetings: "Meeting Intelligence & Audio",
  documents: "Operational Specs & Documents",
  risks: "Autonomous Risk Center",
  announcements: "Broadcast Announcements",
  "my-tasks": "My Assigned Deliverables",
};

export function Header({
  role = "ORGANIZER",
  userName = "Aman (Lead Organizer)",
  onOpenAssistant,
}: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  // Derive active section name from route path
  const segments = pathname.split("/").filter(Boolean);
  const lastSegment = segments[segments.length - 1];
  const activeSection =
    segments.length === 2
      ? "Event Mission Control"
      : PAGE_TITLES[lastSegment] || "Dashboard";

  return (
    <header className="h-16 border-b border-[#1c294d] bg-[#0b1329]/85 backdrop-blur-xl px-6 md:px-8 flex items-center justify-between sticky top-0 z-20 shadow-sm">
      {/* Breadcrumbs & Active Section Title */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-xs text-[#94a3b8]">
          <span className="font-medium text-[#94a3b8]">Workspace</span>
          <ChevronRight className="w-3.5 h-3.5 text-[#94a3b8]/50" />
          <h1 className="text-sm md:text-base font-bold text-[#f8fafc] tracking-tight">
            {activeSection}
          </h1>
        </div>

        <Badge
          variant={role === "ORGANIZER" ? "default" : "secondary"}
          className="text-[10px] uppercase font-mono px-2 py-0.5"
        >
          {role}
        </Badge>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {role === "ORGANIZER" && (
          <Button
            size="sm"
            onClick={onOpenAssistant}
            className="bg-[#b9a8ec] hover:bg-[#9b88d8] text-[#0b1329] gap-2 text-xs font-semibold shadow-md shadow-[#b9a8ec]/20 h-8 px-3.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#0b1329]" />
            <span>Ask AI</span>
            <span className="text-[10px] opacity-75 font-mono ml-0.5">⌘K</span>
          </Button>
        )}

        <div className="flex items-center gap-2.5 pl-3 border-l border-[#1c294d]">
          <div className="w-8 h-8 rounded-full bg-[#131e38] border border-[#1c294d] flex items-center justify-center text-[#b9a8ec] text-xs font-semibold shadow-inner">
            <UserCheck className="w-4 h-4 text-[#b9a8ec]" />
          </div>
          <span className="text-xs text-slate-200 hidden md:inline font-medium tracking-tight">
            {userName}
          </span>
          <button
            onClick={handleLogout}
            title="Sign out of command center"
            className="p-2 text-[#94a3b8] hover:text-rose-400 hover:bg-[#1c294d] rounded-lg transition-colors cursor-pointer ml-1"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
