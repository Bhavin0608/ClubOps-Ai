import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Activity, Sparkles, User } from "lucide-react";
import { formatInAppTimezone } from "@/lib/dates";

interface AuditLogItem {
  id: string;
  action: string;
  entityType: string;
  via: string;
  createdAt: string | Date;
}

export function ActivityFeedWidget({ logs }: { logs: AuditLogItem[] }) {
  return (
    <Card className="border-[#1c294d] bg-[#131e38]/85 shadow-lg rounded-2xl p-6">
      <CardHeader className="p-0 flex flex-row items-center justify-between pb-5 border-b border-[#1c294d]">
        <CardTitle className="text-sm font-bold text-[#f8fafc] flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#87a997]/15 border border-[#87a997]/30 flex items-center justify-center text-[#87a997]">
            <Activity className="w-3.5 h-3.5 text-[#87a997]" />
          </div>
          <span>Live Operations Audit Trail</span>
        </CardTitle>
        <span className="text-[11px] text-[#94a3b8] font-mono">
          Last {logs.length} events
        </span>
      </CardHeader>

      <CardContent className="p-0 pt-5 space-y-2.5">
        {logs.length === 0 ? (
          <div className="text-center py-8 px-4 rounded-xl bg-[#0b1329]/40 border border-dashed border-[#1c294d] text-xs text-[#94a3b8]">
            No operations logged yet in this session
          </div>
        ) : (
          logs.slice(0, 6).map((log) => (
            <div
              key={log.id}
              className="flex items-center justify-between p-3 rounded-xl bg-[#0b1329]/70 border border-[#1c294d] hover:border-[#b9a8ec]/35 transition-all text-xs"
            >
              <div className="flex items-center gap-2.5 truncate pr-3">
                {log.via === "AI" ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#b9a8ec] bg-[#b9a8ec]/15 border border-[#b9a8ec]/30 px-2 py-0.5 rounded-full flex-shrink-0">
                    <Sparkles className="w-2.5 h-2.5 text-[#b9a8ec]" />
                    AI AGENT
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[#94a3b8] bg-[#1c294d] border border-[#253766] px-2 py-0.5 rounded-full flex-shrink-0">
                    <User className="w-2.5 h-2.5 text-[#94a3b8]" />
                    OPERATOR
                  </span>
                )}
                <span className="text-[#f8fafc] font-medium truncate">{log.action}</span>
              </div>
              <span className="text-[11px] text-[#94a3b8] flex-shrink-0 font-mono">
                {formatInAppTimezone(log.createdAt, "HH:mm:ss")}
              </span>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
