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
  }, [eventId]);

  if (loading) return <LoadingState message="Loading announcements..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-blue-400" />
            Announcements & Broadcasts
          </h2>
          <p className="text-xs text-slate-400">
            Draft announcements with AI, review in inert drafts, and publish with one-click WhatsApp copy
          </p>
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
