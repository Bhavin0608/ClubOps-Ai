"use client";

import React, { useState, useEffect, use } from "react";
import { AnnouncementList, AnnouncementItem } from "@/components/announcements/AnnouncementList";
import { AnnouncementDraftModal } from "@/components/announcements/AnnouncementDraftModal";
import { LoadingState } from "@/components/shared/LoadingState";
import { Megaphone } from "lucide-react";

export default function AnnouncementsPage(props: {
  params: Promise<{ eventId: string }>;
}) {
  const params = use(props.params);
  const eventId = params.eventId;

  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAnnouncements = () => {
    fetch(`/api/events/${eventId}/announcements`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        setAnnouncements(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchAnnouncements();

    const handleActionResolved = () => {
      fetchAnnouncements();
    };

    window.addEventListener("clubops:action-resolved", handleActionResolved);
    return () => {
      window.removeEventListener("clubops:action-resolved", handleActionResolved);
    };
  }, [eventId]);

  if (loading) return <LoadingState message="Loading communication channels & broadcasts..." />;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#CAAA98]/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#CAAA98]/25 border border-[#CAAA98]/50 flex items-center justify-center text-[#202940] shadow-xs flex-shrink-0">
            <Megaphone className="w-5 h-5 text-[#202940]" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-[#202940] tracking-tight">
              Announcements & Broadcasts
            </h2>
            <p className="text-xs text-[#4B4038] font-medium">
              Synthesize broadcast announcements with AI, review inert drafts & copy formatted for WhatsApp & Slack
            </p>
          </div>
        </div>

        <AnnouncementDraftModal
          eventId={eventId}
          onDraftCreated={fetchAnnouncements}
        />
      </div>

      <AnnouncementList
        announcements={announcements}
        onUpdated={fetchAnnouncements}
      />
    </div>
  );
}
