import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-[#b9a8ec]/30 bg-[#b9a8ec]/15 text-[#b9a8ec]",
        secondary: "border-[#23335d] bg-[#1c294d] text-[#94a3b8]",
        destructive: "border-rose-800/50 bg-rose-950/60 text-rose-300",
        outline: "border-[#1c294d] text-slate-300 bg-transparent",
        success: "border-[#87a997]/30 bg-[#87a997]/15 text-[#87a997]",
        warning: "border-amber-800/50 bg-amber-950/60 text-amber-300",
        critical: "border-rose-700/80 bg-rose-950/80 text-rose-200 animate-pulse",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
