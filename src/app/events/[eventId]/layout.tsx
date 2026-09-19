"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { Header } from "@/components/layout/Header";
import { AssistantDrawer } from "@/components/ai/AssistantDrawer";

export default function EventLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const eventId = params.eventId as string;

  const [assistantOpen, setAssistantOpen] = useState(false);
  const [userRole, setUserRole] = useState<"ORGANIZER" | "VOLUNTEER">("ORGANIZER");
  const [userName, setUserName] = useState<string>("Aman (Organizer)");

  useEffect(() => {
    fetch("/api/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setUserName(data.user.name);
          const membership = data.memberships.find(
            (m: any) => m.event?.id === eventId
          );
          if (membership) {
            setUserRole(membership.role);
          }
        }
      })
      .catch(() => {});

    // Global keyboard shortcut: Command/Ctrl + K
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setAssistantOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [eventId]);

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex">
      {/* Sidebar */}
      <AppSidebar
        eventId={eventId}
        role={userRole}
        onOpenAssistant={() => setAssistantOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        <Header
          role={userRole}
          userName={userName}
          onOpenAssistant={() => setAssistantOpen(true)}
        />

        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto space-y-6">
          {children}
        </main>
      </div>

      {/* Global Assistant Drawer */}
      {userRole === "ORGANIZER" && (
        <AssistantDrawer
          eventId={eventId}
          isOpen={assistantOpen}
          onClose={() => setAssistantOpen(false)}
        />
      )}
    </div>
  );
}
