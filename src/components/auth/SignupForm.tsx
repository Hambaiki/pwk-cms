"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signup } from "@/lib/actions/auth";
import { AuthInput } from "./AuthInput";
import { AuthSubmitButton } from "./AuthSubmitButton";
import { AuthErrorAlert } from "./AuthErrorAlert";

export function SignupForm() {
  const [state, action] = useActionState(signup, undefined);

  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
      <AuthErrorAlert messages={state?.errors?.general} />

      <AuthInput
        id="displayName"
        name="displayName"
        label="Full Name"
        type="text"
        placeholder="Ada Lovelace"
        autoComplete="name"
        errors={state?.errors?.displayName}
      />

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
        placeholder="Min. 8 chars, 1 uppercase, 1 number"
        autoComplete="new-password"
        errors={state?.errors?.password}
      />

      <AuthSubmitButton
        label="Create Account"
        pendingLabel="Creating account…"
      />

      <p className="text-center text-sm text-cms-text-2">
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-cms-accent underline-offset-4 hover:underline transition-colors"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
