import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Activity, Sparkles, User, Shield } from "lucide-react";
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
    <Card className="border-slate-800">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400" />
          Live Audit Trail (UI vs AI)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2.5">
        {logs.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-400">
            No audit records logged yet
          </div>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              className="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-slate-800 text-xs"
            >
              <div className="flex items-center gap-2 truncate pr-2">
                {log.via === "AI" ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-300 bg-indigo-950 border border-indigo-700/60 px-1.5 py-0.5 rounded">
                    <Sparkles className="w-2.5 h-2.5 text-indigo-400" />
                    AI
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-300 bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded">
                    <User className="w-2.5 h-2.5 text-slate-400" />
                    UI
                  </span>
                )}
                <span className="text-slate-300 font-mono truncate">{log.action}</span>
              </div>
              <span className="text-[10px] text-slate-400 flex-shrink-0 font-mono">
                {formatInAppTimezone(log.createdAt, "HH:mm:ss")}
              </span>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
