'use client'

import { InputHTMLAttributes, forwardRef } from 'react'

interface AuthInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  errors?: string[]
}

export const AuthInput = forwardRef<HTMLInputElement, AuthInputProps>(
  ({ label, errors, id, ...props }, ref) => {
    const hasError = errors && errors.length > 0

    return (
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={id}
          className="text-xs font-semibold uppercase tracking-widest text-stone-400"
        >
          {label}
        </label>
        <input
          ref={ref}
          id={id}
          aria-describedby={hasError ? `${id}-error` : undefined}
          aria-invalid={hasError}
          className={[
            'w-full rounded-lg border bg-stone-900 px-4 py-3 text-sm text-stone-100',
            'placeholder:text-stone-600 outline-none transition-all duration-200',
            'focus:ring-2 focus:ring-amber-500/60 focus:border-amber-500/60',
            hasError
              ? 'border-red-500/60 focus:ring-red-500/40'
              : 'border-stone-700 hover:border-stone-500',
          ].join(' ')}
          {...props}
        />
        {hasError && (
          <ul id={`${id}-error`} className="flex flex-col gap-0.5" role="alert">
            {errors!.map((e) => (
              <li key={e} className="text-xs text-red-400">
                {e}
              </li>
            ))}
          </ul>
        )}
      </div>
    )
  }
)

AuthInput.displayName = 'AuthInput'
