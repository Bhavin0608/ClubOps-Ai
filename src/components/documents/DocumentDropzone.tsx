"use client";

import React, { useState } from "react";
import { UploadCloud, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export function DocumentDropzone({
  eventId,
  onUploaded,
}: {
  eventId: string;
  onUploaded?: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    // Check allowed file extension
    const allowed = [".txt", ".md", ".pdf", ".docx", ".doc", ".csv"];
    const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
    if (!allowed.includes(ext)) {
      toast.error(`Unsupported file type (${ext}). Allowed: ${allowed.join(", ")}`);
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`/api/events/${eventId}/documents`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      toast.success(`"${file.name}" uploaded. Processing chunks into knowledge base...`);
      onUploaded?.();
    } catch (err: any) {
      toast.error(err.message || "Failed to upload document");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragOver(false);
        if (e.dataTransfer.files?.[0]) {
          handleFileUpload(e.dataTransfer.files[0]);
        }
      }}
      className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
        isDragOver
          ? "border-[#202940] bg-[#ECE5DE]/60"
          : "border-[#CAAA98]/60 bg-white/70 hover:border-[#CAAA98] hover:bg-white/90 backdrop-blur-md"
      }`}
    >
      <div className="flex flex-col items-center justify-center space-y-2">
        <div className="w-12 h-12 rounded-full bg-[#ECE5DE] flex items-center justify-center text-[#202940]">
          {uploading ? (
            <Loader2 className="w-6 h-6 animate-spin text-[#202940]" />
          ) : (
            <UploadCloud className="w-6 h-6 text-[#202940]" />
          )}
        </div>

        <div className="space-y-1">
          <p className="text-sm font-bold text-[#202940]">
            {uploading ? "Ingesting and generating embeddings..." : "Upload Club Document or Agreement"}
          </p>
          <p className="text-xs text-[#9A8678]">
            Drag and drop or browse from computer. PDF, DOCX, TXT, MD, CSV supported (max 4 MB).
          </p>
        </div>

        {!uploading && (
          <label className="mt-2 inline-flex items-center justify-center px-4 py-1.5 rounded-lg bg-[#202940] hover:bg-[#1a2133] text-white text-xs font-semibold cursor-pointer shadow-sm transition-colors">
            <span>Browse File</span>
            <input
              type="file"
              className="hidden"
              accept=".txt,.md,.pdf,.docx,.doc,.csv"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  handleFileUpload(e.target.files[0]);
                }
              }}
            />
          </label>
        )}
      </div>
    </div>
  );
}
