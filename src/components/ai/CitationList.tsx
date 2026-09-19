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
    <div className="mt-3 pt-2.5 border-t border-slate-800/80 space-y-1.5">
      <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5 uppercase tracking-wider">
        <BookOpen className="w-3.5 h-3.5 text-blue-400" />
        Verified Citations
      </div>
      <div className="grid gap-1.5">
        {citations.map((c) => (
          <div
            key={c.n}
            className="p-2 rounded bg-slate-950/60 border border-slate-800 text-xs text-slate-300 space-y-1"
          >
            <div className="flex items-center justify-between font-mono text-[11px] text-blue-300">
              <span className="font-semibold">[{c.n}] {c.sourceName}</span>
              {c.locator && <span className="text-slate-400">{c.locator}</span>}
            </div>
            <p className="text-slate-400 text-[11px] italic line-clamp-2">
              &ldquo;{c.snippet}&rdquo;
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
