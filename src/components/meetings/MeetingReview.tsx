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
        <div className="p-5 rounded-2xl bg-white/85 border border-[#CAAA98]/40 shadow-sm space-y-2 backdrop-blur-md">
          <div className="text-[11px] font-bold text-[#202940] uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#CAAA98]" />
            AI Executive Summary
          </div>
          <p className="text-xs text-[#4B4038] leading-relaxed">
            {summary || "No summary available."}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white/85 border border-[#CAAA98]/40 shadow-sm space-y-2 backdrop-blur-md">
          <div className="text-[11px] font-bold text-[#202940] uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Decisions Recorded ({decisions.length})
          </div>
          <ul className="text-xs text-[#4B4038] space-y-1.5 list-disc list-inside">
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
          <h3 className="text-sm font-bold text-[#202940] flex items-center gap-2">
            Extracted Action Items Review
            <span className="text-[10px] font-mono bg-[#ECE5DE] text-[#202940] border border-[#CAAA98]/50 px-2.5 py-0.5 rounded-full font-semibold">
              {pendingItems.length} Proposed · {approvedItems.length} Approved
            </span>
          </h3>
          <p className="text-xs text-[#9A8678]">
            Verify extracted owners and dates before converting items into live tasks
          </p>
        </div>

        {pendingItems.length > 0 && (
          <Button
            size="sm"
            onClick={handleCreateTasks}
            disabled={creating || selectedItemIds.length === 0}
            className="bg-[#202940] hover:bg-[#1a2133] text-white gap-1.5 text-xs font-semibold h-9 shadow-md shadow-[#202940]/15"
          >
            {creating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 text-[#CAAA98]" />
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
                  ? "bg-[#ECE5DE]/30 border-[#CAAA98]/30 opacity-75"
                  : isSelected
                  ? "bg-white border-[#202940]/50 shadow-md ring-1 ring-[#202940]/10"
                  : "bg-white/80 border-[#CAAA98]/40 hover:border-[#CAAA98] hover:shadow-sm"
              }`}
            >
              <div className="flex items-start gap-3">
                {!isCreated && (
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelect(item.id)}
                    className="mt-1 h-4 w-4 rounded border-[#CAAA98] text-[#202940] accent-[#202940] focus:ring-[#202940] cursor-pointer"
                  />
                )}

                <div className="flex-1 space-y-2 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="font-semibold text-[#202940] text-sm">{item.title}</div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                          confidencePercent >= 85
                            ? "bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold"
                            : "bg-amber-50 text-amber-800 border-amber-300 font-semibold"
                        }`}
                      >
                        Confidence: {confidencePercent}%
                      </span>
                      <SeverityBadge level={item.priority} showIcon={false} />
                      {isCreated && (
                        <span className="text-[10px] font-medium text-emerald-800 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1 font-semibold">
                          <Check className="w-3 h-3 text-emerald-600" /> Converted to Task
                        </span>
                      )}
                    </div>
                  </div>

                  {item.description && (
                    <p className="text-[#4B4038] text-xs">{item.description}</p>
                  )}

                  {/* Verbatim Quote */}
                  {item.evidence && (
                    <div className="p-2.5 rounded-lg bg-[#FAF8F5] border border-[#CAAA98]/40 text-[11px] text-[#4B4038] flex items-start gap-2 font-mono">
                      <Quote className="w-3 h-3 text-[#CAAA98] flex-shrink-0 mt-0.5" />
                      <span>&ldquo;{item.evidence}&rdquo;</span>
                    </div>
                  )}

                  {/* Ambiguity Note if any */}
                  {item.ambiguityNote && (
                    <div className="text-[11px] text-amber-800 font-medium flex items-center gap-1.5 bg-amber-50 p-1.5 rounded border border-amber-200">
                      <AlertCircle className="w-3 h-3 flex-shrink-0 text-amber-600" />
                      <span>{item.ambiguityNote}</span>
                    </div>
                  )}

                  {/* Controls: Owner Selector & Deadline */}
                  <div className="flex flex-wrap items-center gap-4 pt-1 text-[#9A8678]">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-[#CAAA98]" />
                      <span className="text-[11px]">Owner:</span>
                      {isCreated ? (
                        <span className="text-[#202940] font-semibold">
                          {item.owner?.name ?? "Unassigned"}
                        </span>
                      ) : (
                        <select
                          value={item.ownerId || ""}
                          onChange={(e) => handleUpdateItemOwner(item.id, e.target.value)}
                          className="bg-white border border-[#CAAA98]/60 text-[#202940] text-xs rounded-md px-2.5 py-1 focus:outline-none focus:border-[#202940] cursor-pointer"
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
                      <Clock className="w-3.5 h-3.5 text-[#CAAA98]" />
                      <span className="text-[11px]">Deadline:</span>
                      {item.deadline ? (
                        <span className="text-[#202940] font-mono font-medium">
                          {formatDisplayDate(item.deadline)}
                        </span>
                      ) : item.deadlineRaw ? (
                        <span className="text-amber-800 font-mono text-[11px] font-medium bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                          &ldquo;{item.deadlineRaw}&rdquo; (Needs date)
                        </span>
                      ) : (
                        <span className="text-[#9A8678] font-mono">No deadline</span>
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
