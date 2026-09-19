"use client";

import React, { useState, useEffect, use } from "react";
import { TaskListTable, TaskRow } from "@/components/tasks/TaskListTable";
import { LoadingState } from "@/components/shared/LoadingState";
import { CheckSquare, UserCheck } from "lucide-react";

export default function MyTasksPage(props: {
  params: Promise<{ eventId: string }>;
}) {
  const params = use(props.params);
  const eventId = params.eventId;

  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [currentMemberId, setCurrentMemberId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const meRes = await fetch("/api/me");
      const meData = await meRes.json();
      const mem = meData.memberships?.find((m: any) => m.event?.id === eventId);
      if (mem) {
        setCurrentMemberId(mem.id);
        const taskRes = await fetch(`/api/events/${eventId}/tasks?ownerId=${mem.id}`);
        const taskData = await taskRes.json();
        setTasks(taskData);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [eventId]);

  if (loading) return <LoadingState message="Loading your assigned tasks..." />;

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-slate-800">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <CheckSquare className="w-5 h-5 text-purple-400" />
          My Assigned Deliverables
        </h2>
        <p className="text-xs text-slate-400">
          Volunteer portal: update the progress status of tasks assigned to you
        </p>
      </div>

      <TaskListTable
        tasks={tasks}
        isVolunteer={true}
        currentMemberId={currentMemberId}
        onTaskUpdated={fetchData}
      />
    </div>
  );
}
