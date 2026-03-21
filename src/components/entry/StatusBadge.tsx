"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// ─── Variants ────────────────────────────────────────────────────────────────

const statusBadgeVariants = cva(
  "inline-flex items-center font-mono text-xs px-1.5 py-0.5 rounded border w-fit capitalize",
  {
    variants: {
      variant: {
        draft: "bg-cms-surface-3 border-cms-border text-cms-text-3",

        published:
          "bg-cms-success-subtle border-cms-success-border text-cms-success",

        archived:
          "bg-cms-danger-subtle border-cms-danger-border text-cms-danger",
      },
    },
    defaultVariants: {
      variant: "draft",
    },
  },
);

// ─── Component ───────────────────────────────────────────────────────────────

interface StatusBadgeProps extends VariantProps<typeof statusBadgeVariants> {
  className?: string;
}

export function StatusBadge({ variant, className }: StatusBadgeProps) {
  return (
    <span className={cn(statusBadgeVariants({ variant }), className)}>
      {variant}
    </span>
  );
}
