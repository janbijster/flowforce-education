import * as React from "react";
import { cn } from "@/lib/utils";

const badgeVariants: Record<
  "default" | "secondary" | "outline" | "destructive",
  string
> = {
  default:
    "inline-flex items-center rounded-full border border-transparent bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground",
  secondary:
    "inline-flex items-center rounded-full border border-transparent bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground",
  outline:
    "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold",
  destructive:
    "inline-flex items-center rounded-full border border-transparent bg-destructive px-3 py-1 text-xs font-semibold text-destructive-foreground",
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: keyof typeof badgeVariants;
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "default", ...props }, ref) => (
    <span
      ref={ref}
      className={cn(badgeVariants[variant], className)}
      {...props}
    />
  )
);

Badge.displayName = "Badge";


