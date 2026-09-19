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
  Layers,
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

  const organizerLinks = [
    { label: "Dashboard", href: `/events/${eventId}`, icon: LayoutDashboard },
    { label: "Tasks", href: `/events/${eventId}/tasks`, icon: CheckSquare },
    { label: "Deadlines", href: `/events/${eventId}/deadlines`, icon: Clock },
    { label: "Volunteers", href: `/events/${eventId}/volunteers`, icon: Users },
    { label: "Meetings", href: `/events/${eventId}/meetings`, icon: Video },
    { label: "Documents", href: `/events/${eventId}/documents`, icon: FileText },
    { label: "Risks", href: `/events/${eventId}/risks`, icon: AlertTriangle },
    { label: "Announcements", href: `/events/${eventId}/announcements`, icon: Megaphone },
  ];

  const volunteerLinks = [
    { label: "My Tasks", href: `/events/${eventId}/my-tasks`, icon: CheckSquare },
    { label: "Announcements", href: `/events/${eventId}/announcements`, icon: Megaphone },
  ];

  const links = role === "VOLUNTEER" ? volunteerLinks : organizerLinks;

  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-950 flex flex-col h-screen fixed top-0 left-0 z-30">
      {/* Brand & Logo */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
              ClubOps AI
              <span className="text-[10px] font-mono bg-blue-900/60 text-blue-300 px-1 py-0.2 rounded border border-blue-700/60">
                v1.0
              </span>
            </div>
            <div className="text-[10px] text-slate-400">Mission Control</div>
          </div>
        </div>
      </div>

      {/* Event Switcher */}
      <div className="p-3 border-b border-slate-800/80">
        <EventSwitcher currentEventId={eventId} />
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2">
          Operations
        </div>
        {links.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors",
                isActive
                  ? "bg-blue-600/15 text-blue-400 border border-blue-500/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
              )}
            >
              <Icon className={cn("w-4 h-4", isActive ? "text-blue-400" : "text-slate-400")} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* AI Assistant Quick Trigger (Organizer only) */}
      {role === "ORGANIZER" && (
        <div className="p-3 border-t border-slate-800/80">
          <button
            onClick={onOpenAssistant}
            className="w-full p-2.5 rounded-xl bg-gradient-to-r from-blue-600/20 via-indigo-600/20 to-purple-600/20 border border-blue-500/40 hover:border-blue-400 text-left transition-all group flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-md">
                <Sparkles className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <div className="text-xs font-semibold text-white group-hover:text-blue-300">
                  AI Assistant
                </div>
                <div className="text-[10px] text-slate-400">Open Command Drawer</div>
              </div>
            </div>
            <div className="text-[10px] font-mono text-slate-400 bg-slate-900/80 px-1.5 py-0.5 rounded border border-slate-800">
              ⌘K
            </div>
          </button>
        </div>
      )}
    </aside>
  );
}
