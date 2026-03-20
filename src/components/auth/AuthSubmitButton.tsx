"use client";

import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils";

interface AuthSubmitButtonProps {
  label: string;
  pendingLabel?: string;
}

export function AuthSubmitButton({
  label,
  pendingLabel,
}: AuthSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className={cn(
        "relative w-full overflow-hidden rounded-lg px-4 py-3 text-sm font-semibold transition-all duration-200",

        // base
        "bg-cms-accent text-cms-accent-text",

        // interaction
        "hover:bg-cms-accent-dim active:scale-[0.98]",

        // disabled
        "disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100",

        // focus
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cms-accent focus-visible:ring-offset-2 focus-visible:ring-offset-cms-bg",
      )}
    >
      {pending ? (
        <span className="flex items-center justify-center gap-2">
          <svg
            className="h-4 w-4 animate-spin"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          {pendingLabel ?? "Please wait…"}
        </span>
      ) : (
        label
      )}
    </button>
  );
}
