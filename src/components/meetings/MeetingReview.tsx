"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { SeverityBadge } from "@/components/shared/SeverityBadge";
import { Check, CheckCircle2, Clock, FileText, Loader2, Sparkles, User, AlertCircle, Quote } from "lucide-react";
import { toast } from "sonner";
import { formatDisplayDate } from "@/lib/dates";

export interface ActionItemRow {
  id: string;
  title: string;
  description?: string | null;
  ownerNameRaw?: string | null;
  ownerId?: string | null;
  deadline?: string | null;
  deadlineRaw?: string | null;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  confidence: number;
  evidence?: string | null;
  ambiguityNote?: string | null;
  status: "PROPOSED" | "APPROVED" | "REJECTED";
  taskId?: string | null;
  owner?: { id: string; name: string } | null;
}

interface MeetingReviewProps {
  meetingId: string;
  summary?: string | null;
  decisions: string[];
  actionItems: ActionItemRow[];
  members: { id: string; name: string; team?: string | null }[];
  onTasksCreated?: () => void;
}

export function MeetingReview({
  meetingId,
  summary,
  decisions,
  actionItems,
  members,
  onTasksCreated,
}: MeetingReviewProps) {
  const [items, setItems] = useState<ActionItemRow[]>(actionItems);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>(
    actionItems.filter((i) => i.status === "PROPOSED").map((i) => i.id)
  );
  const [creating, setCreating] = useState(false);

  const toggleSelect = (id: string) => {
    setSelectedItemIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleUpdateItemOwner = async (itemId: string, newOwnerId: string) => {
    try {
      const res = await fetch(`/api/meeting-items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ownerId: newOwnerId || null }),
      });
      if (!res.ok) throw new Error("Failed to update owner");

      setItems((prev) =>
        prev.map((it) =>
          it.id === itemId
            ? {
                ...it,
                ownerId: newOwnerId || null,
                owner: members.find((m) => m.id === newOwnerId) ?? null,
              }
            : it
        )
      );
      toast.success("Owner updated");
    } catch (err: any) {
      toast.error(err.message || "Failed to update owner");
    }
  };

  const handleCreateTasks = async () => {
    if (selectedItemIds.length === 0) {
      toast.error("Please select at least one item to convert to a task");
      return;
    }

    setCreating(true);
    try {
      const res = await fetch(`/api/meetings/${meetingId}/create-tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemIds: selectedItemIds }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create tasks");

      toast.success(`Successfully created ${data.length} tasks with "Meeting" badge!`);
      onTasksCreated?.();
    } catch (err: any) {
      toast.error(err.message || "Failed to create tasks");
    } finally {
      setCreating(false);
    }
  };

  const pendingItems = items.filter((i) => i.status === "PROPOSED");
  const approvedItems = items.filter((i) => i.status === "APPROVED");

  return (
    <div className="space-y-6">
      {/* Summary & Decisions Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2">
          <div className="text-xs font-semibold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            AI Executive Summary
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {summary || "No summary available."}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2">
          <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Decisions Recorded ({decisions.length})
          </div>
          <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
            {decisions.map((d, i) => (
              <li key={i} className="leading-relaxed">
                {d}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Review Screen Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            Extracted Action Items Review
            <span className="text-[10px] font-mono bg-purple-950 text-purple-300 border border-purple-800 px-2 py-0.5 rounded-full">
              {pendingItems.length} Proposed · {approvedItems.length} Approved
            </span>
          </h3>
          <p className="text-xs text-slate-400">
            Verify extracted owners and dates before converting items into live tasks
          </p>
        </div>

        {pendingItems.length > 0 && (
          <Button
            size="sm"
            onClick={handleCreateTasks}
            disabled={creating || selectedItemIds.length === 0}
            className="bg-purple-600 hover:bg-purple-500 text-white gap-1.5 text-xs font-semibold h-9 shadow-lg shadow-purple-500/20"
          >
            {creating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            Create {selectedItemIds.length} Tasks
          </Button>
        )}
      </div>

      {/* Action Items List */}
      <div className="space-y-3">
        {items.map((item) => {
          const isSelected = selectedItemIds.includes(item.id);
          const isCreated = item.status === "APPROVED";
          const confidencePercent = Math.round(item.confidence * 100);

          return (
            <div
              key={item.id}
              className={`p-4 rounded-xl border transition-all ${
                isCreated
                  ? "bg-slate-900/30 border-slate-800/60 opacity-80"
                  : isSelected
                  ? "bg-slate-900/90 border-purple-500/40 shadow-sm"
                  : "bg-slate-900/50 border-slate-800"
              }`}
            >
              <div className="flex items-start gap-3">
                {!isCreated && (
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelect(item.id)}
                    className="mt-1 h-4 w-4 rounded border-slate-700 bg-slate-950 text-purple-600 focus:ring-purple-500 cursor-pointer"
                  />
                )}

                <div className="flex-1 space-y-2 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="font-semibold text-slate-100 text-sm">{item.title}</div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                          confidencePercent >= 85
                            ? "bg-emerald-950/70 text-emerald-300 border-emerald-800/60"
                            : "bg-amber-950/70 text-amber-300 border-amber-800/60"
                        }`}
                      >
                        Confidence: {confidencePercent}%
                      </span>
                      <SeverityBadge level={item.priority} showIcon={false} />
                      {isCreated && (
                        <span className="text-[10px] font-medium text-emerald-400 bg-emerald-950 border border-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Check className="w-3 h-3" /> Converted to Task
                        </span>
                      )}
                    </div>
                  </div>

                  {item.description && (
                    <p className="text-slate-400 text-xs">{item.description}</p>
                  )}

                  {/* Verbatim Quote */}
                  {item.evidence && (
                    <div className="p-2 rounded bg-slate-950/80 border border-slate-800 text-[11px] text-slate-300 flex items-start gap-1.5 font-mono">
                      <Quote className="w-3 h-3 text-purple-400 flex-shrink-0 mt-0.5" />
                      <span>&ldquo;{item.evidence}&rdquo;</span>
                    </div>
                  )}

                  {/* Ambiguity Note if any */}
                  {item.ambiguityNote && (
                    <div className="text-[11px] text-amber-400 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 flex-shrink-0" />
                      <span>{item.ambiguityNote}</span>
                    </div>
                  )}

                  {/* Controls: Owner Selector & Deadline */}
                  <div className="flex flex-wrap items-center gap-4 pt-1 text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-500" />
                      <span className="text-[11px]">Owner:</span>
                      {isCreated ? (
                        <span className="text-slate-200 font-medium">
                          {item.owner?.name ?? "Unassigned"}
                        </span>
                      ) : (
                        <select
                          value={item.ownerId || ""}
                          onChange={(e) => handleUpdateItemOwner(item.id, e.target.value)}
                          className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded px-2 py-0.5 focus:outline-none"
                        >
                          <option value="">(Unassigned)</option>
                          {members.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name} ({m.team || "General"})
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span className="text-[11px]">Deadline:</span>
                      {item.deadline ? (
                        <span className="text-slate-200 font-mono">
                          {formatDisplayDate(item.deadline)}
                        </span>
                      ) : item.deadlineRaw ? (
                        <span className="text-amber-300 font-mono text-[11px]">
                          &ldquo;{item.deadlineRaw}&rdquo; (Needs date)
                        </span>
                      ) : (
                        <span className="text-slate-500 font-mono">No deadline</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
