"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// ─── Variants ────────────────────────────────────────────────────────────────

const roleBadgeVariants = cva(
  "inline-flex items-center font-mono text-xs px-1.5 py-0.5 rounded border w-fit capitalize",
  {
    variants: {
      variant: {
        owner: "bg-cms-accent-subtle border-cms-accent-border text-cms-accent",

        editor:
          "bg-cms-success-subtle border-cms-success-border text-cms-success",

        viewer: "bg-cms-surface-3 border-cms-border text-cms-text-3",
      },
    },
    defaultVariants: {
      variant: "viewer",
    },
  },
);

// ─── Component ───────────────────────────────────────────────────────────────

interface RoleBadgeProps extends VariantProps<typeof roleBadgeVariants> {
  className?: string;
}

export function RoleBadge({ variant, className }: RoleBadgeProps) {
  return (
    <span className={cn(roleBadgeVariants({ variant }), className)}>
      {variant}
    </span>
  );
}
