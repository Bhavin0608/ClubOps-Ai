import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#b9a8ec] disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-[#b9a8ec] text-[#0b1329] font-semibold shadow-lg shadow-[#b9a8ec]/20 hover:bg-[#9b88d8] active:bg-[#8a75cf]",
        destructive:
          "bg-rose-600 text-white shadow-sm hover:bg-rose-500 active:bg-rose-700",
        outline:
          "border border-[#1c294d] bg-[#131e38]/70 hover:bg-[#1c294d] hover:text-[#f8fafc] text-slate-200 hover:border-[#b9a8ec]/40 shadow-sm",
        secondary:
          "bg-[#1c294d] text-[#f8fafc] shadow-sm hover:bg-[#253766] border border-[#253766]/50",
        ghost:
          "hover:bg-[#1c294d]/70 hover:text-[#f8fafc] text-slate-300",
        link:
          "text-[#b9a8ec] underline-offset-4 hover:underline hover:text-[#9b88d8]",
        accent:
          "bg-gradient-to-r from-[#b9a8ec] via-[#ab99e4] to-[#9b88d8] text-[#0b1329] font-semibold hover:opacity-95 shadow-lg shadow-[#b9a8ec]/25 border-0",
        success:
          "bg-[#87a997] text-[#0b1329] font-semibold hover:bg-[#6b8c7b] shadow-md shadow-[#87a997]/20",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-lg px-6 text-base",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
