import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  className?: string;
  variant?: "default" | "success" | "warning" | "danger";
}

export const StatsCard = ({
  title,
  value,
  description,
  icon: Icon,
  trend,
  trendValue,
  className,
  variant = "default",
}: StatsCardProps) => {
  const variantStyles = {
    default: "border-border",
    success: "border-green-200 dark:border-green-900/50 bg-gradient-to-br from-green-50/50 to-transparent dark:from-green-950/20",
    warning: "border-orange-200 dark:border-orange-900/50 bg-gradient-to-br from-orange-50/50 to-transparent dark:from-orange-950/20",
    danger: "border-red-200 dark:border-red-900/50 bg-gradient-to-br from-red-50/50 to-transparent dark:from-red-950/20",
  };

  const iconStyles = {
    default: "text-primary",
    success: "text-green-600 dark:text-green-400",
    warning: "text-orange-600 dark:text-orange-400",
    danger: "text-red-600 dark:text-red-400",
  };

  return (
    <Card 
      className={cn(
        "relative overflow-hidden transition-all duration-300 hover:shadow-card-hover hover:scale-[1.02]",
        variantStyles[variant],
        className
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {Icon && (
          <div className={cn(
            "h-8 w-8 rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center",
            iconStyles[variant]
          )}>
            <Icon className="h-4 w-4" />
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl sm:text-3xl font-bold">
          {value}
        </div>
        {(description || trendValue) && (
          <div className="flex items-center gap-2 mt-1">
            {description && (
              <p className="text-xs text-muted-foreground">
                {description}
              </p>
            )}
            {trendValue && (
              <span className={cn(
                "text-xs font-medium",
                trend === "up" && "text-green-600 dark:text-green-400",
                trend === "down" && "text-red-600 dark:text-red-400",
                trend === "neutral" && "text-muted-foreground"
              )}>
                {trendValue}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
