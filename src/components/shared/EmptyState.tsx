import React from "react";
import { cn } from "@/lib/utils";
import { FolderOpen } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  title,
  description,
  icon,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 text-center rounded-2xl border border-dashed border-[#CAAA98]/60 bg-white/70 backdrop-blur-md my-4",
        className
      )}
    >
      <div className="w-12 h-12 rounded-2xl bg-[#CAAA98]/20 border border-[#CAAA98]/40 flex items-center justify-center mb-3 text-[#202940]">
        {icon || <FolderOpen className="w-6 h-6 text-[#9A8678]" />}
      </div>
      <h4 className="text-base font-bold text-[#202940]">{title}</h4>
      <p className="text-xs text-[#9A8678] max-w-sm mt-1 mb-4 leading-relaxed">
        {description}
      </p>
      {action && <div>{action}</div>}
    </div>
  );
}
