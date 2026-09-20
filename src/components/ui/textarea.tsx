import * as React from "react";
import { cn } from "@/lib/utils";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-lg border border-[#CAAA98]/60 bg-white/90 px-3 py-2 text-sm text-[#202940] shadow-sm placeholder:text-[#9A8678]/70 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#202940] focus-visible:border-[#202940] disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
