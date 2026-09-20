import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-[#CAAA98]/60 bg-[#CAAA98]/20 text-[#202940]",
        secondary: "border-[#9A8678]/30 bg-[#9A8678]/10 text-[#4B4038]",
        destructive: "border-rose-200 bg-rose-50 text-rose-700",
        outline: "border-[#9A8678]/40 bg-white/60 text-[#4B4038]",
        success: "border-emerald-200 bg-emerald-50 text-emerald-800",
        warning: "border-amber-200 bg-amber-50 text-amber-800",
        critical: "border-rose-400 bg-rose-100 text-rose-900 font-bold animate-pulse",
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
