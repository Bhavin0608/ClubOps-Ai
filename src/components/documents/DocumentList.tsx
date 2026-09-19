"use client";

import React from "react";
import { FileText, Trash2, CheckCircle2, Loader2, AlertCircle, Database } from "lucide-react";
import { toast } from "sonner";

export interface DocumentItem {
  id: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  status: "PROCESSING" | "READY" | "FAILED";
  errorMessage?: string | null;
  createdAt: string | Date;
  _count?: { chunks: number };
}

interface DocumentListProps {
  documents: DocumentItem[];
  onDocumentDeleted?: () => void;
  onAskAboutDoc?: (docName: string) => void;
}

export function DocumentList({
  documents,
  onDocumentDeleted,
  onAskAboutDoc,
}: DocumentListProps) {
  const handleDelete = async (docId: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}" and its indexed knowledge chunks?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/documents/${docId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete document");
      toast.success("Document deleted");
      onDocumentDeleted?.();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete");
    }
  };

  if (documents.length === 0) {
    return (
      <div className="text-center py-12 text-xs text-slate-400 rounded-xl border border-dashed border-slate-800">
        No documents uploaded yet
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {documents.map((doc) => {
        const sizeKB = Math.round(doc.sizeBytes / 1024);
        const chunkCount = doc._count?.chunks ?? 0;

        return (
          <div
            key={doc.id}
            className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-between gap-3 text-xs"
          >
            <div className="flex items-center gap-3 truncate">
              <div className="w-9 h-9 rounded-lg bg-blue-600/15 border border-blue-500/30 flex items-center justify-center text-blue-400 flex-shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <div className="truncate space-y-0.5">
                <div className="font-semibold text-slate-200 truncate">{doc.name}</div>
                <div className="text-[11px] text-slate-400 flex items-center gap-2 font-mono">
                  <span>{sizeKB} KB</span>
                  <span>·</span>
                  <span className="flex items-center gap-1 text-slate-400">
                    <Database className="w-3 h-3 text-blue-400" />
                    {chunkCount} vector chunks
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              {doc.status === "READY" && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3 h-3" /> Indexed & Ready
                </span>
              )}
              {doc.status === "PROCESSING" && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-400 bg-blue-950/60 border border-blue-800/60 px-2 py-0.5 rounded-full animate-pulse">
                  <Loader2 className="w-3 h-3 animate-spin" /> Chunking...
                </span>
              )}
              {doc.status === "FAILED" && (
                <span
                  title={doc.errorMessage || "Failed"}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-400 bg-rose-950/60 border border-rose-800/60 px-2 py-0.5 rounded-full"
                >
                  <AlertCircle className="w-3 h-3" /> Failed
                </span>
              )}

              {onAskAboutDoc && doc.status === "READY" && (
                <button
                  onClick={() => onAskAboutDoc(doc.name)}
                  className="text-blue-400 hover:text-blue-300 font-medium px-2 py-1 rounded bg-blue-950/40 border border-blue-800/50 text-[11px]"
                >
                  Ask AI
                </button>
              )}

              <button
                onClick={() => handleDelete(doc.id, doc.name)}
                className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
                title="Delete file"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
