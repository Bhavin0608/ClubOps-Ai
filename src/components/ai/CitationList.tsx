import React from "react";
import { BookOpen } from "lucide-react";

export interface CitationItem {
  n: number;
  sourceName: string;
  locator?: string;
  snippet: string;
}

interface CitationListProps {
  citations: CitationItem[];
}

export function CitationList({ citations }: CitationListProps) {
  if (!citations || citations.length === 0) return null;

  return (
    <div className="mt-3 pt-2.5 border-t border-[#CAAA98]/30 space-y-1.5">
      <div className="text-[11px] font-bold text-[#202940] flex items-center gap-1.5 uppercase tracking-wider">
        <BookOpen className="w-3.5 h-3.5 text-[#202940]" />
        Verified Citations
      </div>
      <div className="grid gap-1.5">
        {citations.map((c) => (
          <div
            key={c.n}
            className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#CAAA98]/40 text-xs text-[#4B4038] space-y-1 shadow-xs"
          >
            <div className="flex items-center justify-between font-mono text-[11px] text-[#202940]">
              <span className="font-bold">[{c.n}] {c.sourceName}</span>
              {c.locator && <span className="text-[#9A8678] font-medium">{c.locator}</span>}
            </div>
            <p className="text-[#4B4038] text-[11px] italic line-clamp-2 font-medium">
              &ldquo;{c.snippet}&rdquo;
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
