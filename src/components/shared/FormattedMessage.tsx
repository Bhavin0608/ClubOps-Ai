"use client";

import React from "react";

interface FormattedMessageProps {
  content: string;
}

export function FormattedMessage({ content }: FormattedMessageProps) {
  if (!content) return null;

  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];

  let inTable = false;
  let tableRows: string[] = [];

  let inList = false;
  let listItems: string[] = [];

  const flushTable = (key: number) => {
    if (tableRows.length === 0) return;
    const headerRow = tableRows[0];
    const dataRows = tableRows.slice(1).filter((r) => !r.match(/^\|\s*[-:]+\s*\|/));

    const parseCells = (row: string) =>
      row
        .split("|")
        .slice(1, -1)
        .map((c) => c.trim());

    const headers = parseCells(headerRow);

    // Render as responsive, modern cards rather than cramped horizontal tables
    elements.push(
      <div key={`table-${key}`} className="my-3 space-y-2">
        {dataRows.map((row, rIdx) => {
          const cells = parseCells(row);
          if (cells.length === 0 || cells.every((c) => !c)) return null;

          // Main title is usually the first or second cell (e.g. Milestone / Task)
          const titleIdx = headers.findIndex((h) =>
            /task|milestone|item|deliverable|title|name/i.test(h)
          );
          const primaryIdx = titleIdx !== -1 ? titleIdx : (cells[1] ? 1 : 0);
          const primaryText = cells[primaryIdx] || cells[0];

          return (
            <div
              key={rIdx}
              className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700/80 transition-all text-xs space-y-1.5 shadow-sm"
            >
              <div className="font-semibold text-slate-100 flex items-start justify-between gap-2">
                <span>{renderInline(primaryText)}</span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                {cells.map((cell, cIdx) => {
                  if (cIdx === primaryIdx || !cell) return null;
                  const label = headers[cIdx] || "";
                  const isStatus = /status/i.test(label);
                  const isPriority = /priority/i.test(label);

                  return (
                    <span
                      key={cIdx}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border ${
                        isStatus && /blocked/i.test(cell)
                          ? "bg-red-950/40 text-red-300 border-red-800/50"
                          : isStatus && /done|completed/i.test(cell)
                          ? "bg-emerald-950/40 text-emerald-300 border-emerald-800/50"
                          : isPriority && /critical|high/i.test(cell)
                          ? "bg-amber-950/40 text-amber-300 border-amber-800/50"
                          : "bg-slate-950 text-slate-300 border-slate-800"
                      }`}
                    >
                      {label && <span className="text-slate-400 font-medium">{label}:</span>}
                      <span>{renderInline(cell)}</span>
                    </span>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );

    tableRows = [];
    inTable = false;
  };

  const flushList = (key: number) => {
    if (listItems.length === 0) return;
    elements.push(
      <ul key={`list-${key}`} className="my-2 space-y-1.5 text-xs text-slate-200">
        {listItems.map((item, i) => (
          <li key={i} className="flex items-start gap-2.5 leading-relaxed">
            <span className="text-blue-400 font-bold select-none text-[12px] leading-none mt-1.5">•</span>
            <div className="flex-1">{renderInline(item)}</div>
          </li>
        ))}
      </ul>
    );
    listItems = [];
    inList = false;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Check table line
    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      if (inList) flushList(i);
      inTable = true;
      tableRows.push(trimmed);
      continue;
    } else if (inTable) {
      flushTable(i);
    }

    // Check list item (*, -, •, or 1.)
    const listMatch = trimmed.match(/^([*•-]|\d+\.)\s+(.+)$/);
    if (listMatch) {
      if (inTable) flushTable(i);
      inList = true;
      listItems.push(listMatch[2]);
      continue;
    } else if (inList) {
      flushList(i);
    }

    // Clean, modern section headings
    if (trimmed.startsWith("### ") || trimmed.startsWith("#### ")) {
      const headingText = trimmed.replace(/^#{3,4}\s+/, "").replace(/^\d+\.\s*/, "");
      elements.push(
        <div key={i} className="pt-3 pb-1 flex items-center gap-2">
          <div className="w-1.5 h-3 bg-blue-500 rounded-full" />
          <span className="text-xs font-semibold text-blue-300 tracking-wide uppercase">
            {renderInline(headingText)}
          </span>
        </div>
      );
      continue;
    }

    if (trimmed.startsWith("## ") || trimmed.startsWith("# ")) {
      const headingText = trimmed.replace(/^#+\s+/, "");
      elements.push(
        <div key={i} className="pt-3.5 pb-1.5 border-b border-slate-800/80 mb-1">
          <span className="text-sm font-bold text-white">
            {renderInline(headingText)}
          </span>
        </div>
      );
      continue;
    }

    // Dividers: render subtle spacing
    if (trimmed === "---" || trimmed === "***") {
      elements.push(<div key={i} className="my-2 border-t border-slate-800/60" />);
      continue;
    }

    // Blank line
    if (!trimmed) {
      continue;
    }

    // Normal paragraph
    elements.push(
      <p key={i} className="text-xs leading-relaxed text-slate-200 my-1">
        {renderInline(trimmed)}
      </p>
    );
  }

  if (inTable) flushTable(lines.length);
  if (inList) flushList(lines.length);

  return <div className="space-y-1">{elements}</div>;
}

function renderInline(text: string): React.ReactNode {
  if (!text) return text;
  const parts: React.ReactNode[] = [];
  // Match bold (**text**), italic (*text*), and code (`code`)
  const regex = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith("**") && token.endsWith("**")) {
      parts.push(
        <strong key={match.index} className="font-semibold text-white">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith("`") && token.endsWith("`")) {
      parts.push(
        <code
          key={match.index}
          className="px-1.5 py-0.5 rounded bg-slate-950 text-blue-300 font-mono text-[11px] border border-slate-800"
        >
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith("*") && token.endsWith("*") && token.length > 2) {
      parts.push(
        <em key={match.index} className="italic text-slate-300">
          {token.slice(1, -1)}
        </em>
      );
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}
