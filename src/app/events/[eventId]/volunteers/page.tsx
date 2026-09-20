"use client";

import React, { useState, useEffect, use } from "react";
import { VolunteerList, MemberRow } from "@/components/volunteers/VolunteerList";
import { VolunteerAddModal } from "@/components/volunteers/VolunteerAddModal";
import { LoadingState } from "@/components/shared/LoadingState";
import { Users } from "lucide-react";

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
  }, [eventId]);

  if (loading) return <LoadingState message="Loading volunteer roster..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#CAAA98]/30">
        <div>
          <h2 className="text-lg font-extrabold text-[#202940] flex items-center gap-2">
            <Users className="w-5 h-5 text-[#202940]" />
            Volunteers & Team Allocation
          </h2>
          <p className="text-xs text-[#4B4038] font-medium">
            Monitor volunteer workload, skill tags, and prevent individual member burnout
          </p>
        </div>

        <VolunteerAddModal eventId={eventId} onAdded={fetchMembers} />
      </div>

      <VolunteerList members={members} onMemberUpdated={fetchMembers} />
    </div>
  );
}
