"use client";

import React, { useState, useEffect, use } from "react";
import { DocumentDropzone } from "@/components/documents/DocumentDropzone";
import { DocumentList, DocumentItem } from "@/components/documents/DocumentList";
import { LoadingState } from "@/components/shared/LoadingState";
import { FileText, Sparkles, BookOpen } from "lucide-react";

export default function DocumentsPage(props: {
  params: Promise<{ eventId: string }>;
}) {
  const params = use(props.params);
  const eventId = params.eventId;

  const [docs, setDocs] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDocs = () => {
    fetch(`/api/events/${eventId}/documents`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        setDocs(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchDocs();
    // Poll document processing status if any are PROCESSING
    const interval = setInterval(() => {
      if (docs.some((d) => d.status === "PROCESSING")) {
        fetchDocs();
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [eventId]);

  if (loading) return <LoadingState message="Connecting to event knowledge repository..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#CAAA98]/40">
        <div>
          <h2 className="text-lg font-bold text-[#202940] flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#202940]" />
            Club Knowledge & Document Repository (RAG)
          </h2>
          <p className="text-xs text-[#9A8678]">
            Upload PDF, DOCX, and TXT agreements. Extracted, vectorized, and retrieved with verbatim citations.
          </p>
        </div>
      </div>

      <DocumentDropzone eventId={eventId} onUploaded={fetchDocs} />

      <div className="space-y-3">
        <h3 className="text-xs font-bold text-[#202940] uppercase tracking-wider">
          Indexed Documents ({docs.length})
        </h3>
        <DocumentList
          documents={docs}
          onDocumentDeleted={fetchDocs}
        />
      </div>
    </div>
  );
}
