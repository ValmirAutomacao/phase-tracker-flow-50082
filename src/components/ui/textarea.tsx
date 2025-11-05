import * as React from "react";

import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[80px] w-full rounded-lg border border-input bg-background px-3 py-2 text-base sm:text-sm transition-all placeholder:text-muted-foreground focus:outline-none focus:ring-0 focus:border-2 focus:border-[#0891b2] disabled:cursor-not-allowed disabled:opacity-50 touch-manipulation [font-size:16px] sm:[font-size:14px]",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
