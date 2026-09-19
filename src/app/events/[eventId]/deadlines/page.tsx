"use client";

import React, { useState, useEffect, use } from "react";
import { DeadlinesView } from "@/components/deadlines/DeadlinesView";
import { LoadingState } from "@/components/shared/LoadingState";
import { Clock } from "lucide-react";
import { TaskRow } from "@/components/tasks/TaskListTable";

export default function DeadlinesPage(props: {
  params: Promise<{ eventId: string }>;
}) {
  const params = use(props.params);
  const eventId = params.eventId;

  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = () => {
    fetch(`/api/events/${eventId}/tasks`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        setTasks(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchTasks();
  }, [eventId]);

  if (loading) return <LoadingState message="Calculating deadline telemetry..." />;

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-slate-800">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Clock className="w-5 h-5 text-amber-400" />
          Operational Deadlines & Urgency
        </h2>
        <p className="text-xs text-slate-400">
          Saved views for overdue items, 7-day upcoming deliverables, and unscheduled work
        </p>
      </div>

      <DeadlinesView tasks={tasks} onTaskUpdated={fetchTasks} />
    </div>
  );
}
