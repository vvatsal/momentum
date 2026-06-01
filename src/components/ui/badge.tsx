import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-primary/15 text-cyan-300 ring-1 ring-primary/30",
        secondary: "bg-secondary text-secondary-foreground",
        success: "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30",
        warning: "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30",
        muted: "bg-muted text-muted-foreground",
        outline: "border border-border text-foreground",
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

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
