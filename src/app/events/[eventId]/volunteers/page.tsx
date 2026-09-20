"use client";

import React, { useState, useEffect, use } from "react";
import { VolunteerList, MemberRow } from "@/components/volunteers/VolunteerList";
import { VolunteerAddModal } from "@/components/volunteers/VolunteerAddModal";
import { LoadingState } from "@/components/shared/LoadingState";
import { Users2, UserPlus } from "lucide-react";

export default function VolunteersPage(props: {
  params: Promise<{ eventId: string }>;
}) {
  const params = use(props.params);
  const eventId = params.eventId;

  const [members, setMembers] = useState<MemberRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMembers = () => {
    fetch(`/api/events/${eventId}/members`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        setMembers(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchMembers();

    const handleActionResolved = () => {
      fetchMembers();
    };

    window.addEventListener("clubops:action-resolved", handleActionResolved);
    return () => {
      window.removeEventListener("clubops:action-resolved", handleActionResolved);
    };
  }, [eventId]);

  if (loading) return <LoadingState message="Loading team roster & capacity telemetry..." />;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#CAAA98]/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#CAAA98]/25 border border-[#CAAA98]/50 flex items-center justify-center text-[#202940] shadow-xs flex-shrink-0">
            <Users2 className="w-5 h-5 text-[#202940]" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-[#202940] tracking-tight">
              Volunteers & Team Allocation Roster
            </h2>
            <p className="text-xs text-[#4B4038] font-medium">
              Monitor departmental capacity, prevent individual volunteer burnout & track skill coverage
            </p>
          </div>
        </div>

        <VolunteerAddModal eventId={eventId} onAdded={fetchMembers} />
      </div>

      {/* Main Roster & Department Workgroups */}
      <VolunteerList
        members={members}
        onMemberUpdated={fetchMembers}
      />
    </div>
  );
}
