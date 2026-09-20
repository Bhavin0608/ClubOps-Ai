"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface MemberOption {
  id: string;
  name: string;
  team?: string | null;
}

interface TaskCreateModalProps {
  eventId: string;
  members: MemberOption[];
  onTaskCreated?: () => void;
}

export function TaskCreateModal({
  eventId,
  members,
  onTaskCreated,
}: TaskCreateModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [team, setTeam] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [deadline, setDeadline] = useState("");
  const [ownerId, setOwnerId] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/events/${eventId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: description || undefined,
          team: team || undefined,
          priority,
          deadline: deadline || undefined,
          ownerId: ownerId || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create task");

      toast.success("Task created successfully");
      setOpen(false);
      setTitle("");
      setDescription("");
      setTeam("");
      setDeadline("");
      setOwnerId("");
      onTaskCreated?.();
    } catch (err: any) {
      toast.error(err.message || "Failed to create task");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        size="sm"
        onClick={() => setOpen(true)}
        className="bg-[#202940] hover:bg-[#2c395b] text-white gap-1.5 text-xs font-bold h-8 shadow-xs"
      >
        <Plus className="w-3.5 h-3.5" />
        New Task
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#202940]/40 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md bg-white/95 border border-[#CAAA98]/60 rounded-2xl shadow-2xl p-6 space-y-4 backdrop-blur-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#CAAA98]/30">
              <h3 className="text-base font-extrabold text-[#202940]">Create New Task</h3>
              <button
                onClick={() => setOpen(false)}
                className="p-1 rounded-lg text-[#9A8678] hover:text-[#202940] hover:bg-[#CAAA98]/20 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="text-[#4B4038] font-bold">Task Title *</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Finalize stage & seating plan"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[#4B4038] font-bold">Description</label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Operational details or notes..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[#4B4038] font-bold">Team</label>
                  <Input
                    value={team}
                    onChange={(e) => setTeam(e.target.value)}
                    placeholder="Logistics, Tech, etc."
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[#4B4038] font-bold">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg bg-[#FAF8F5] border border-[#CAAA98]/60 text-[#202940] font-semibold text-xs focus:outline-none focus:border-[#202940]"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[#4B4038] font-bold">Deadline Date</label>
                  <Input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[#4B4038] font-bold">Assign Owner</label>
                  <select
                    value={ownerId}
                    onChange={(e) => setOwnerId(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg bg-[#FAF8F5] border border-[#CAAA98]/60 text-[#202940] font-semibold text-xs focus:outline-none focus:border-[#202940]"
                  >
                    <option value="">Unassigned</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.team || "General"})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#CAAA98]/30">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setOpen(false)}
                  className="border-[#CAAA98]/60 hover:bg-[#CAAA98]/20 text-[#4B4038] font-bold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={loading}
                  className="bg-[#202940] hover:bg-[#2c395b] text-white font-bold"
                >
                  {loading && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
                  Create Task
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
