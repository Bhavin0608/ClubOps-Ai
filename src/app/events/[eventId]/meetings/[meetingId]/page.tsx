"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { MeetingReview, ActionItemRow } from "@/components/meetings/MeetingReview";
import { LoadingState } from "@/components/shared/LoadingState";
import { ArrowLeft, Calendar, Users } from "lucide-react";
import { formatDisplayDate } from "@/lib/dates";

export default function MeetingDetailPage(props: {
  params: Promise<{ eventId: string; meetingId: string }>;
}) {
  const params = use(props.params);
  const { eventId, meetingId } = params;

  const [meeting, setMeeting] = useState<any>(null);
  const [members, setMembers] = useState<{ id: string; name: string; team?: string | null }[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    Promise.all([
      fetch(`/api/meetings/${meetingId}`).then((r) => (r.ok ? r.json() : null)),
      fetch(`/api/events/${eventId}/members`).then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([m, memList]) => {
        setMeeting(m);
        setMembers(memList);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, [eventId, meetingId]);

  if (loading) return <LoadingState message="Loading meeting extraction review..." />;
  if (!meeting) return <div className="text-center py-12 text-xs text-rose-400">Meeting not found</div>;

  return (
    <div className="space-y-6">
      {/* Header & Back Link */}
      <div className="space-y-2 pb-4 border-b border-[#CAAA98]/40">
        <Link
          href={`/events/${eventId}/meetings`}
          className="inline-flex items-center gap-1.5 text-xs text-[#9A8678] hover:text-[#202940] transition-colors font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Meetings
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h2 className="text-xl font-bold text-[#202940] tracking-tight">{meeting.title}</h2>
          <div className="flex items-center gap-3 text-xs text-[#9A8678]">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#CAAA98]" />
              {formatDisplayDate(meeting.meetingDate)}
            </span>
            {meeting.participants?.length > 0 && (
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#CAAA98]" />
                {meeting.participants.join(", ")}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Review Screen Component */}
      <MeetingReview
        meetingId={meetingId}
        summary={meeting.summary}
        decisions={meeting.decisions || []}
        actionItems={meeting.actionItems || []}
        members={members}
        onTasksCreated={fetchData}
      />
    </div>
  );
}
