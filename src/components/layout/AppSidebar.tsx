"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { EventSwitcher } from "./EventSwitcher";
import {
  LayoutDashboard,
  CheckSquare,
  Clock,
  Users,
  Video,
  FileText,
  AlertTriangle,
  Megaphone,
  Sparkles,
  Shield,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AppSidebarProps {
  eventId: string;
  role?: "ORGANIZER" | "VOLUNTEER";
  onOpenAssistant?: () => void;
}

export function AppSidebar({
  eventId,
  role = "ORGANIZER",
  onOpenAssistant,
}: AppSidebarProps) {
  const pathname = usePathname();

  const operationsLinks = [
    { label: "Dashboard", href: `/events/${eventId}`, icon: LayoutDashboard },
    { label: "Tasks & Workflows", href: `/events/${eventId}/tasks`, icon: CheckSquare },
    { label: "Deadlines & Milestones", href: `/events/${eventId}/deadlines`, icon: Clock },
  ];

  const collaborationLinks = [
    { label: "Volunteers & Roster", href: `/events/${eventId}/volunteers`, icon: Users },
    { label: "Meeting Notes & AI", href: `/events/${eventId}/meetings`, icon: Video },
    { label: "Announcements", href: `/events/${eventId}/announcements`, icon: Megaphone },
  ];

  const governanceLinks = [
    { label: "Documents & Specs", href: `/events/${eventId}/documents`, icon: FileText },
    { label: "Risk Center", href: `/events/${eventId}/risks`, icon: AlertTriangle },
  ];

  const volunteerLinks = [
    { label: "My Assigned Tasks", href: `/events/${eventId}/my-tasks`, icon: CheckSquare },
    { label: "Announcements", href: `/events/${eventId}/announcements`, icon: Megaphone },
  ];

  const renderNavGroup = (title: string, items: typeof operationsLinks) => (
    <div className="space-y-1.5">
      <div className="text-[10px] font-bold text-[#94a3b8]/80 uppercase tracking-wider px-3 mb-1">
        {title}
      </div>
      {items.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all",
              isActive
                ? "bg-[#b9a8ec]/15 text-[#b9a8ec] border border-[#b9a8ec]/35 font-semibold shadow-sm shadow-[#b9a8ec]/5"
                : "text-[#94a3b8] hover:text-[#f8fafc] hover:bg-[#1c294d]/60"
            )}
          >
            <Icon
              className={cn(
                "w-4 h-4 flex-shrink-0 transition-transform",
                isActive ? "text-[#b9a8ec] scale-105" : "text-[#94a3b8]"
              )}
            />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </div>
  );

  return (
    <aside className="w-64 border-r border-[#1c294d] bg-[#0b1329]/95 backdrop-blur-2xl flex flex-col h-screen fixed top-0 left-0 z-30 shadow-2xl">
      {/* Brand & Logo */}
      <div className="p-4 border-b border-[#1c294d] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#b9a8ec] to-[#9b88d8] flex items-center justify-center text-[#0b1329] font-bold shadow-lg shadow-[#b9a8ec]/20">
            <Shield className="w-5 h-5 text-[#0b1329]" />
          </div>
          <div>
            <div className="text-sm font-bold text-[#f8fafc] tracking-tight flex items-center gap-1.5">
              ClubOps AI
              <span className="text-[10px] font-mono bg-[#b9a8ec]/15 text-[#b9a8ec] px-1.5 py-0.5 rounded border border-[#b9a8ec]/30 font-semibold">
                v1.0
              </span>
            </div>
            <div className="text-[11px] text-[#94a3b8]">Autonomous Operations</div>
          </div>
        </div>
      </div>

      {/* Switcher & Back to Workspaces */}
      <div className="p-3 border-b border-[#1c294d]/80 space-y-2">
        <Link
          href="/events"
          className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-medium text-[#94a3b8] hover:text-[#b9a8ec] transition-colors group"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          <span>All Workspaces</span>
        </Link>
        <EventSwitcher currentEventId={eventId} />
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 p-3.5 space-y-5 overflow-y-auto">
        {role === "VOLUNTEER" ? (
          renderNavGroup("Operations", volunteerLinks)
        ) : (
          <>
            {renderNavGroup("Operations", operationsLinks)}
            {renderNavGroup("Team & Comms", collaborationLinks)}
            {renderNavGroup("Governance & Risk", governanceLinks)}
          </>
        )}
      </nav>

      {/* AI Assistant Quick Trigger (Organizer only) */}
      {role === "ORGANIZER" && (
        <div className="p-3.5 border-t border-[#1c294d]/80 bg-[#131e38]/40">
          <button
            onClick={onOpenAssistant}
            className="w-full p-3 rounded-xl bg-gradient-to-r from-[#b9a8ec]/15 via-[#9b88d8]/15 to-[#87a997]/15 border border-[#b9a8ec]/35 hover:border-[#b9a8ec]/70 hover:shadow-lg hover:shadow-[#b9a8ec]/10 text-left transition-all group flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#b9a8ec] flex items-center justify-center text-[#0b1329] shadow-md shadow-[#b9a8ec]/25 group-hover:scale-105 transition-transform">
                <Sparkles className="w-4 h-4 text-[#0b1329] animate-pulse" />
              </div>
              <div>
                <div className="text-xs font-bold text-[#f8fafc] group-hover:text-[#b9a8ec] transition-colors">
                  AI Command Center
                </div>
                <div className="text-[10px] text-[#94a3b8]">Ask anything & execute</div>
              </div>
            </div>
            <div className="text-[10px] font-mono text-[#94a3b8] bg-[#0b1329] px-2 py-0.5 rounded border border-[#1c294d]">
              ⌘K
            </div>
          </button>
        </div>
      )}
    </aside>
  );
}
