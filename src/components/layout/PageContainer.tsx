import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageContainerProps {
  children: ReactNode;
  className?: string;
  title?: string;
  description?: string;
  actions?: ReactNode;
}

export const PageContainer = ({ 
  children, 
  className, 
  title, 
  description, 
  actions 
}: PageContainerProps) => {
  return (
    <div className={cn("min-h-full bg-gradient-to-br from-background to-muted/20", className)}>
      <div className="container-fluid p-4 sm:p-6 lg:p-8 space-y-6 animate-fade-in">
        {(title || description || actions) && (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              {title && (
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  {title}
                </h1>
              )}
              {description && (
                <p className="text-sm sm:text-base text-muted-foreground">
                  {description}
                </p>
              )}
            </div>
            {actions && (
              <div className="flex gap-2 sm:gap-3">
                {actions}
              </div>
            )}
          </div>
        )}
        {children}
      </div>
    </div>
  );
};
