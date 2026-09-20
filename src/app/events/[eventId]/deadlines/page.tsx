"use client";

import React, { useState, useEffect, use } from "react";
import { DeadlinesView } from "@/components/deadlines/DeadlinesView";
import { TaskCreateModal, MemberOption } from "@/components/tasks/TaskCreateModal";
import { LoadingState } from "@/components/shared/LoadingState";
import { CalendarClock, Plus } from "lucide-react";
import { TaskRow } from "@/components/tasks/TaskListTable";

export default function DeadlinesPage(props: {
  params: Promise<{ eventId: string }>;
}) {
  const params = use(props.params);
  const eventId = params.eventId;

  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [members, setMembers] = useState<MemberOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const fetchData = () => {
    Promise.all([
      fetch(`/api/events/${eventId}/tasks`).then((r) => (r.ok ? r.json() : [])),
      fetch(`/api/events/${eventId}/members`).then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([taskList, memberList]) => {
        setTasks(taskList);
        setMembers(memberList);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();

    const handleActionResolved = () => {
      fetchData();
    };

    window.addEventListener("clubops:action-resolved", handleActionResolved);
    return () => {
      window.removeEventListener("clubops:action-resolved", handleActionResolved);
    };
  }, [eventId]);

  if (loading) return <LoadingState message="Calculating deadline telemetry & milestone timelines..." />;

  return (
    <div className="space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#CAAA98]/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-800 shadow-xs flex-shrink-0">
            <CalendarClock className="w-5 h-5 text-amber-700" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-[#202940] tracking-tight">
              Deadlines & Milestones Roadmap
            </h2>
            <p className="text-xs text-[#4B4038] font-medium">
              Chronological deliverable roadmaps, urgency telemetry, and 48h milestone checkpoints
            </p>
          </div>
        </div>

        <TaskCreateModal
          eventId={eventId}
          members={members}
          existingTasks={tasks}
          open={isCreateOpen}
          onOpenChange={setIsCreateOpen}
          onTaskCreated={fetchData}
          triggerButton={
            <button
              type="button"
              className="bg-[#202940] hover:bg-[#182033] text-[#FAF8F5] gap-1.5 text-xs font-bold h-9 px-3.5 rounded-xl shadow-md shadow-[#202940]/15 hover:shadow-lg transition-all border border-[#CAAA98]/30 flex items-center cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#CAAA98]" />
              <span>Schedule Milestone</span>
            </button>
          }
        />
      </div>

      {/* Main Deadlines & Milestones View */}
      <DeadlinesView
        tasks={tasks}
        onTaskUpdated={fetchData}
        onCreateMilestone={() => setIsCreateOpen(true)}
      />
    </div>
  );
}
