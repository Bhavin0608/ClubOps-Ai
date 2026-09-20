"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { MeetingCreateModal } from "@/components/meetings/MeetingCreateModal";
import { LoadingState } from "@/components/shared/LoadingState";
import { Video, Calendar, CheckCircle2, ArrowRight, Sparkles } from "lucide-react";
import { formatDisplayDate } from "@/lib/dates";

interface MeetingItem {
  id: string;
  title: string;
  meetingDate: string;
  participants: string[];
  summary?: string | null;
  status: string;
  _count?: { actionItems: number };
}

export default function MeetingsPage(props: {
  params: Promise<{ eventId: string }>;
}) {
  const params = use(props.params);
  const eventId = params.eventId;

  const [meetings, setMeetings] = useState<MeetingItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMeetings = () => {
    fetch(`/api/events/${eventId}/meetings`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        setMeetings(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchMeetings();
  }, [eventId]);

  if (loading) return <LoadingState message="Loading meeting transcripts..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#CAAA98]/30">
        <div>
          <h2 className="text-lg font-extrabold text-[#202940] flex items-center gap-2">
            <Video className="w-5 h-5 text-[#202940]" />
            Meeting Notes & AI Action Extraction
          </h2>
          <p className="text-xs text-[#4B4038] font-medium">
            Process meeting transcripts into verified action items with confidence scores and verbatim quotes
          </p>
        </div>

        <MeetingCreateModal
          eventId={eventId}
          onMeetingCreated={fetchMeetings}
        />
      </div>

      {meetings.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-dashed border-[#CAAA98]/60 bg-white/60 space-y-3">
          <Video className="w-10 h-10 text-[#9A8678] mx-auto" />
          <h3 className="text-base font-extrabold text-[#202940]">No meetings recorded yet</h3>
          <p className="text-xs text-[#4B4038] max-w-sm mx-auto font-medium">
            Click &ldquo;Process Meeting&rdquo; to paste your meeting notes or load the Scene 3 demo transcript.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {meetings.map((m) => (
            <Link
              key={m.id}
              href={`/events/${eventId}/meetings/${m.id}`}
              className="p-5 rounded-2xl bg-white/90 border border-[#CAAA98]/40 hover:border-[#CAAA98] hover:shadow-md transition-all space-y-3 group block shadow-xs"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-[#202940] group-hover:text-[#4B4038] transition-colors">
                    {m.title}
                  </h3>
                  <div className="text-xs text-[#9A8678] flex items-center gap-1.5 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-[#9A8678]" />
                    <span>{formatDisplayDate(m.meetingDate)}</span>
                  </div>
                </div>

                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-[#CAAA98]/25 text-[#202940] border border-[#CAAA98]/50 flex items-center gap-1 font-bold">
                  <Sparkles className="w-3 h-3 text-[#202940]" />
                  {m._count?.actionItems ?? 0} Actions
                </span>
              </div>

              {m.summary && (
                <p className="text-xs text-[#4B4038] line-clamp-2 leading-relaxed font-medium">
                  {m.summary}
                </p>
              )}

              <div className="pt-2 border-t border-[#CAAA98]/20 flex items-center justify-between text-xs text-[#202940] font-bold">
                <span>Review & Approve Tasks</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
