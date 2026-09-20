import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#202940] disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-[#202940] text-white font-semibold shadow-md shadow-[#202940]/20 hover:bg-[#2c395b] active:bg-[#171f33]",
        destructive:
          "bg-rose-600 text-white shadow-sm hover:bg-rose-700 active:bg-rose-800",
        outline:
          "border border-[#CAAA98]/60 bg-white/80 hover:bg-[#FAF8F5] text-[#4B4038] hover:text-[#202940] hover:border-[#CAAA98] shadow-sm",
        secondary:
          "bg-[#CAAA98]/20 text-[#202940] hover:bg-[#CAAA98]/35 border border-[#CAAA98]/40",
        ghost:
          "hover:bg-[#CAAA98]/20 text-[#4B4038] hover:text-[#202940]",
        link:
          "text-[#202940] underline-offset-4 hover:underline hover:text-[#4B4038]",
        accent:
          "bg-gradient-to-r from-[#CAAA98] via-[#dfc4b4] to-[#CAAA98] text-[#202940] font-bold hover:brightness-105 shadow-md shadow-[#CAAA98]/25 border-0",
        success:
          "bg-emerald-700 text-white font-semibold hover:bg-emerald-800 shadow-md shadow-emerald-700/20",
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
