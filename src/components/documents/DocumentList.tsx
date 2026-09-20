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
      <div className="text-center py-12 text-xs text-[#9A8678] rounded-2xl border border-dashed border-[#CAAA98]/50 bg-white/40">
        No documents uploaded yet
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {documents.map((doc) => {
        const sizeKB = Math.round(doc.sizeBytes / 1024);
        const chunkCount = doc._count?.chunks ?? 0;

        return (
          <div
            key={doc.id}
            className="p-4 rounded-xl bg-white/85 border border-[#CAAA98]/40 hover:border-[#CAAA98] hover:shadow-sm transition-all flex items-center justify-between gap-3 text-xs backdrop-blur-md"
          >
            <div className="flex items-center gap-3 truncate">
              <div className="w-10 h-10 rounded-xl bg-[#ECE5DE] border border-[#CAAA98]/40 flex items-center justify-center text-[#202940] flex-shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <div className="truncate space-y-0.5">
                <div className="font-bold text-[#202940] truncate text-sm">{doc.name}</div>
                <div className="text-[11px] text-[#9A8678] flex items-center gap-2 font-mono">
                  <span>{sizeKB} KB</span>
                  <span>·</span>
                  <span className="flex items-center gap-1 text-[#4B4038]">
                    <Database className="w-3 h-3 text-[#CAAA98]" />
                    {chunkCount} vector chunks
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              {doc.status === "READY" && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-300 px-2.5 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Indexed & Ready
                </span>
              )}
              {doc.status === "PROCESSING" && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#202940] bg-[#ECE5DE] border border-[#CAAA98]/60 px-2.5 py-0.5 rounded-full animate-pulse">
                  <Loader2 className="w-3 h-3 animate-spin text-[#202940]" /> Chunking...
                </span>
              )}
              {doc.status === "FAILED" && (
                <span
                  title={doc.errorMessage || "Failed"}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-800 bg-rose-50 border border-rose-300 px-2.5 py-0.5 rounded-full"
                >
                  <AlertCircle className="w-3 h-3 text-rose-600" /> Failed
                </span>
              )}

              {onAskAboutDoc && doc.status === "READY" && (
                <button
                  onClick={() => onAskAboutDoc(doc.name)}
                  className="text-[#202940] hover:bg-[#ECE5DE] font-semibold px-2.5 py-1 rounded-lg bg-[#FAF8F5] border border-[#CAAA98]/60 text-[11px] shadow-sm transition-colors"
                >
                  Ask AI
                </button>
              )}

              <button
                onClick={() => handleDelete(doc.id, doc.name)}
                className="p-1.5 text-[#9A8678] hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
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
