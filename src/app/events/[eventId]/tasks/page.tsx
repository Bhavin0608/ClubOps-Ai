"use client";

import React, { useState, useEffect, use } from "react";
import { TaskListTable, TaskRow } from "@/components/tasks/TaskListTable";
import { TaskCreateModal } from "@/components/tasks/TaskCreateModal";
import { LoadingState } from "@/components/shared/LoadingState";
import { CheckSquare } from "lucide-react";

export default function TasksPage(props: {
  params: Promise<{ eventId: string }>;
}) {
  const params = use(props.params);
  const eventId = params.eventId;

  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [members, setMembers] = useState<{ id: string; name: string; team?: string | null }[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <LoadingState message="Loading event tasks..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#CAAA98]/30">
        <div>
          <h2 className="text-lg font-extrabold text-[#202940] flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-[#202940]" />
            Task Management & Operations
          </h2>
          <p className="text-xs text-[#4B4038] font-medium">
            Monitor deliverables, filter by owner or team, and inspect prerequisite dependencies
          </p>
        </div>

        <TaskCreateModal
          eventId={eventId}
          members={members}
          onTaskCreated={fetchData}
        />
      </div>

      <TaskListTable tasks={tasks} onTaskUpdated={fetchData} />
    </div>
  );
}
