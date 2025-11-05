import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 sm:h-10 min-h-[44px] sm:min-h-[40px] w-full rounded-lg border border-input bg-background px-3 sm:px-4 py-2 text-base sm:text-sm transition-all file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-0 focus:border-2 focus:border-[#0891b2] disabled:cursor-not-allowed disabled:opacity-50 touch-manipulation [font-size:16px] sm:[font-size:14px]",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
