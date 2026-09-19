"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Sparkles, LogOut, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface HeaderProps {
  title?: string;
  role?: "ORGANIZER" | "VOLUNTEER";
  userName?: string;
  onOpenAssistant?: () => void;
}

export function Header({
  title = "Command Dashboard",
  role = "ORGANIZER",
  userName = "Aman (Lead Organizer)",
  onOpenAssistant,
}: HeaderProps) {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <h1 className="text-base font-semibold text-white tracking-tight">{title}</h1>
        <Badge
          variant={role === "ORGANIZER" ? "default" : "secondary"}
          className="text-[10px] uppercase font-mono px-2 py-0.5"
        >
          {role}
        </Badge>
      </div>

      <div className="flex items-center gap-3">
        {role === "ORGANIZER" && (
          <Button
            size="sm"
            variant="outline"
            onClick={onOpenAssistant}
            className="border-blue-500/40 text-blue-300 hover:bg-blue-600/10 gap-1.5 text-xs font-medium"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            Ask AI
          </Button>
        )}

        <div className="flex items-center gap-2 pl-3 border-l border-slate-800">
          <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 text-xs font-semibold">
            <UserCheck className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <span className="text-xs text-slate-300 hidden md:inline font-medium">{userName}</span>
          <button
            onClick={handleLogout}
            title="Sign out"
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-900 rounded-md transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
}
