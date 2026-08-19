import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-gradient-brand text-white shadow-glow",
        secondary:
          "border-white/10 bg-white/5 text-foreground",
        destructive:
          "border-transparent bg-destructive/20 text-destructive",
        success:
          "border-transparent bg-emerald-500/15 text-emerald-300",
        warning:
          "border-transparent bg-amber-500/15 text-amber-300",
        muted:
          "border-transparent bg-muted text-muted-foreground",
        outline:
          "border-border text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
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
