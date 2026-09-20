"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { MeetingCreateModal } from "@/components/meetings/MeetingCreateModal";
import { LoadingState } from "@/components/shared/LoadingState";
import { Video, Calendar, CheckCircle2, ArrowRight, Sparkles, Users, FileText } from "lucide-react";
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

    const handleActionResolved = () => {
      fetchMeetings();
    };

    window.addEventListener("clubops:action-resolved", handleActionResolved);
    return () => {
      window.removeEventListener("clubops:action-resolved", handleActionResolved);
    };
  }, [eventId]);

  const totalActions = meetings.reduce((acc, m) => acc + (m._count?.actionItems ?? 0), 0);

  if (loading) return <LoadingState message="Loading meeting transcripts & action items..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#CAAA98]/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#CAAA98]/25 border border-[#CAAA98]/50 flex items-center justify-center text-[#202940] shadow-xs flex-shrink-0">
            <Video className="w-5 h-5 text-[#202940]" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-[#202940] tracking-tight">
              Meeting Notes & AI Action Extraction
            </h2>
            <p className="text-xs text-[#4B4038] font-medium">
              Transcribe meeting notes into verified action items with confidence scores and verbatim quotes
            </p>
          </div>
        </div>

        <MeetingCreateModal
          eventId={eventId}
          onMeetingCreated={fetchMeetings}
        />
      </div>

      {/* Telemetry Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
        <div className="p-4 rounded-2xl glass-architectural border border-[#CAAA98]/40 shadow-xs">
          <div className="text-[11px] font-bold text-[#4B4038] uppercase tracking-wider mb-1">
            Recorded Sessions
          </div>
          <div className="text-2xl font-black text-[#202940]">{meetings.length}</div>
          <div className="text-[11px] text-[#9A8678] font-medium">meeting debriefs</div>
        </div>

        <div className="p-4 rounded-2xl glass-architectural border border-[#CAAA98]/40 shadow-xs">
          <div className="text-[11px] font-bold text-[#4B4038] uppercase tracking-wider mb-1">
            Synthesized Actions
          </div>
          <div className="text-2xl font-black text-[#202940]">{totalActions}</div>
          <div className="text-[11px] text-[#9A8678] font-medium">deliverables captured</div>
        </div>

        <div className="p-4 rounded-2xl glass-architectural border border-[#CAAA98]/40 shadow-xs col-span-2 sm:col-span-1">
          <div className="text-[11px] font-bold text-[#4B4038] uppercase tracking-wider mb-1">
            AI Engine Status
          </div>
          <div className="flex items-center gap-1.5 text-sm font-bold text-emerald-700">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Ready for Transcription</span>
          </div>
          <div className="text-[11px] text-[#9A8678] font-medium">verbatim quote linking</div>
        </div>
      </div>

      {/* Meetings List */}
      {meetings.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-dashed border-[#CAAA98]/60 bg-white/60 space-y-3">
          <Video className="w-10 h-10 text-[#9A8678] mx-auto" />
          <h3 className="text-base font-extrabold text-[#202940]">No meetings recorded yet</h3>
          <p className="text-xs text-[#4B4038] max-w-sm mx-auto font-medium">
            Click &ldquo;Process Meeting&rdquo; to paste notes or load the Scene 3 demo transcript.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {meetings.map((m) => (
            <Link
              key={m.id}
              href={`/events/${eventId}/meetings/${m.id}`}
              className="p-5 rounded-2xl glass-architectural border border-[#CAAA98]/45 hover:border-[#CAAA98] hover:shadow-md transition-all space-y-3.5 group block shadow-xs"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <h3 className="text-sm font-extrabold text-[#202940] group-hover:text-[#4B4038] transition-colors">
                    {m.title}
                  </h3>
                  <div className="text-xs text-[#9A8678] flex items-center gap-1.5 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-[#9A8678]" />
                    <span>{formatDisplayDate(m.meetingDate)}</span>
                  </div>
                </div>

                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-[#CAAA98]/25 text-[#202940] border border-[#CAAA98]/50 flex items-center gap-1 font-bold shadow-2xs">
                  <Sparkles className="w-3 h-3 text-[#202940]" />
                  {m._count?.actionItems ?? 0} Actions
                </span>
              </div>

              {m.summary && (
                <p className="text-xs text-[#4B4038] line-clamp-2 leading-relaxed font-medium bg-[#FAF8F5]/80 p-3 rounded-xl border border-[#CAAA98]/30">
                  {m.summary}
                </p>
              )}

              {/* Participants */}
              {m.participants && m.participants.length > 0 && (
                <div className="flex items-center gap-1.5 text-[11px] text-[#9A8678]">
                  <Users className="w-3.5 h-3.5" />
                  <span>
                    {m.participants.slice(0, 3).join(", ")}
                    {m.participants.length > 3 ? ` +${m.participants.length - 3}` : ""}
                  </span>
                </div>
              )}

              <div className="pt-2 border-t border-[#CAAA98]/20 flex items-center justify-between text-xs text-[#202940] font-bold">
                <span>Review & Approve Extracted Tasks</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform text-[#CAAA98]" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
