import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your account",
};

export default function LoginPage() {
  return (
    <>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-cms-text tracking-tight">
          Welcome back
        </h1>
        <p className="mt-1 text-sm text-cms-text-2">
          Sign in to continue to your account.
        </p>
      </div>

      <LoginForm />
    </>
  );
}
