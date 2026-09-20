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
    <Card className="border-[#CAAA98]/30 bg-white/80 shadow-xs hover:shadow-sm transition-all duration-300 rounded-3xl p-6 sm:p-7 backdrop-blur-xl">
      <CardHeader className="p-0 flex flex-row items-center justify-between pb-5 border-b border-[#CAAA98]/20">
        <CardTitle className="text-sm font-bold text-[#202940] flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#CAAA98]/15 border border-[#CAAA98]/35 flex items-center justify-center text-[#202940] shadow-xs">
            <Activity className="w-4 h-4 text-[#202940]" />
          </div>
          <span>Autonomous Activity & Audit Trail</span>
        </CardTitle>
        <span className="text-[11px] text-[#9A8678] font-mono font-medium">
          Last {logs.length} operations
        </span>
      </CardHeader>

      <CardContent className="p-0 pt-5 space-y-2.5">
        {logs.length === 0 ? (
          <div className="text-center py-8 px-4 rounded-2xl bg-[#FAF8F5] border border-dashed border-[#CAAA98]/40 text-xs text-[#9A8678]">
            No operations logged yet in this session
          </div>
        ) : (
          logs.slice(0, 6).map((log) => (
            <div
              key={log.id}
              className="flex items-center justify-between p-3.5 rounded-2xl bg-white/95 border border-[#CAAA98]/30 hover:border-[#CAAA98]/60 transition-all duration-300 text-xs shadow-xs"
            >
              <div className="flex items-center gap-2.5 truncate pr-3">
                {log.via === "AI" ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#202940] bg-[#CAAA98]/25 border border-[#CAAA98]/50 px-2 py-0.5 rounded-full flex-shrink-0">
                    <Sparkles className="w-2.5 h-2.5 text-[#202940]" />
                    AI AGENT
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#4B4038] bg-[#FAF8F5] border border-[#CAAA98]/35 px-2 py-0.5 rounded-full flex-shrink-0">
                    <User className="w-2.5 h-2.5 text-[#9A8678]" />
                    OPERATOR
                  </span>
                )}
                <span className="text-[#202940] font-medium truncate">{log.action}</span>
              </div>
              <span className="text-[11px] text-[#9A8678] flex-shrink-0 font-mono font-medium">
                {formatInAppTimezone(log.createdAt, "HH:mm:ss")}
              </span>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
