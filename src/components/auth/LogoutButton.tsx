"use client";

import { useTransition } from "react";
import { logout } from "@/lib/actions/auth";
import { cn } from "@/lib/utils";

interface LogoutButtonProps {
  className?: string;
}

export function LogoutButton({ className }: LogoutButtonProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      onClick={() => startTransition(() => logout())}
      disabled={isPending}
      className={cn(
        "text-sm transition-colors",

        // base
        "text-cms-text-2",

        // interaction
        "hover:text-cms-danger",

        // disabled
        "disabled:opacity-50 disabled:cursor-not-allowed",

        // focus (accessibility)
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cms-danger",

        className,
      )}
    >
      {isPending ? "Signing out…" : "Sign Out"}
    </button>
  );
}
