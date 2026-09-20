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
      <div className="text-[10px] font-extrabold text-[#9A8678] uppercase tracking-wider px-3 mb-1">
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
                ? "bg-[#CAAA98]/25 text-[#202940] border border-[#CAAA98]/60 font-bold shadow-xs"
                : "text-[#4B4038] hover:text-[#202940] hover:bg-[#CAAA98]/15"
            )}
          >
            <Icon
              className={cn(
                "w-4 h-4 flex-shrink-0 transition-transform",
                isActive ? "text-[#202940] scale-105" : "text-[#9A8678]"
              )}
            />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </div>
  );

  return (
    <aside className="w-64 border-r border-[#CAAA98]/40 bg-[#FAF8F5]/90 backdrop-blur-2xl flex flex-col h-screen fixed top-0 left-0 z-30 shadow-lg">
      {/* Brand & Logo */}
      <div className="p-4 border-b border-[#CAAA98]/30 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#202940] flex items-center justify-center text-[#CAAA98] font-bold shadow-md shadow-[#202940]/20">
            <Shield className="w-5 h-5 text-[#CAAA98]" />
          </div>
          <div>
            <div className="text-sm font-extrabold text-[#202940] tracking-tight flex items-center gap-1.5">
              ClubOps AI
              <span className="text-[10px] font-mono bg-[#CAAA98]/25 text-[#202940] px-1.5 py-0.5 rounded border border-[#CAAA98]/40 font-bold">
                v2.0
              </span>
            </div>
            <div className="text-[11px] text-[#9A8678] font-medium">Autonomous Operations</div>
          </div>
        </div>
      </div>

      {/* Switcher & Back to Workspaces */}
      <div className="p-3 border-b border-[#CAAA98]/30 space-y-2">
        <Link
          href="/events"
          className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-semibold text-[#9A8678] hover:text-[#202940] transition-colors group"
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
        <div className="p-3.5 border-t border-[#CAAA98]/30 bg-[#FAF8F5]/50">
          <button
            onClick={onOpenAssistant}
            className="w-full p-3 rounded-2xl bg-gradient-to-r from-[#CAAA98]/20 via-white to-[#CAAA98]/20 border border-[#CAAA98]/50 hover:border-[#CAAA98] hover:shadow-md text-left transition-all group flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#202940] flex items-center justify-center text-[#CAAA98] shadow-sm group-hover:scale-105 transition-transform">
                <Sparkles className="w-4 h-4 text-[#CAAA98] animate-pulse" />
              </div>
              <div>
                <div className="text-xs font-bold text-[#202940] group-hover:text-[#4B4038] transition-colors">
                  AI Command Center
                </div>
                <div className="text-[10px] text-[#9A8678]">Ask anything & execute</div>
              </div>
            </div>
            <div className="text-[10px] font-mono text-[#4B4038] bg-white px-2 py-0.5 rounded-md border border-[#CAAA98]/40 shadow-xs font-bold">
              ⌘K
            </div>
          </button>
        </div>
      )}
    </aside>
  );
}
