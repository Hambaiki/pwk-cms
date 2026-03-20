"use client";

import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface AuthInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  errors?: string[];
}

export const AuthInput = forwardRef<HTMLInputElement, AuthInputProps>(
  ({ label, errors, id, className, ...props }, ref) => {
    const hasError = errors && errors.length > 0;

    return (
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={id}
          className="text-xs font-semibold uppercase tracking-widest text-cms-text-2"
        >
          {label}
        </label>

        <input
          ref={ref}
          id={id}
          aria-describedby={hasError ? `${id}-error` : undefined}
          aria-invalid={hasError}
          className={cn(
            "w-full rounded-lg border px-4 py-3 text-sm transition-all duration-200 outline-none",

            // base
            "bg-cms-surface text-cms-text placeholder:text-cms-text-3",
            "border-cms-border hover:border-cms-border-2",

            // focus (default)
            "focus:ring-2 focus:ring-cms-accent/60 focus:border-cms-accent/60",

            // error override
            hasError &&
              "border-cms-danger-border focus:ring-cms-danger/40 focus:border-cms-danger",

            className,
          )}
          {...props}
        />

        {hasError && (
          <ul id={`${id}-error`} className="flex flex-col gap-0.5" role="alert">
            {errors!.map((e) => (
              <li key={e} className="text-xs text-cms-danger">
                {e}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  },
);

AuthInput.displayName = "AuthInput";
