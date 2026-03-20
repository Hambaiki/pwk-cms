'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { login } from '@/lib/actions/auth'
import { AuthInput } from './AuthInput'
import { AuthSubmitButton } from './AuthSubmitButton'
import { AuthErrorAlert } from './AuthErrorAlert'

export function LoginForm() {
  const [state, action] = useActionState(login, undefined)

  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
      <AuthErrorAlert messages={state?.errors?.general} />

      <AuthInput
        id="email"
        name="email"
        label="Email"
        type="email"
        placeholder="you@example.com"
        autoComplete="email"
        errors={state?.errors?.email}
      />

      <AuthInput
        id="password"
        name="password"
        label="Password"
        type="password"
        placeholder="Your password"
        autoComplete="current-password"
        errors={state?.errors?.password}
      />

      <div className="flex justify-end">
        <Link
          href="/forgot-password"
          className="text-xs text-stone-500 hover:text-amber-400 transition-colors underline-offset-4 hover:underline"
        >
          Forgot password?
        </Link>
      </div>

      <AuthSubmitButton label="Sign In" pendingLabel="Signing in…" />

      <p className="text-center text-sm text-stone-500">
        Don&apos;t have an account?{' '}
        <Link
          href="/auth/signup"
          className="text-amber-400 underline-offset-4 hover:underline transition-colors"
        >
          Create one
        </Link>
      </p>
    </form>
  )
}
