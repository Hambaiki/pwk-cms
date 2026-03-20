import type { Metadata } from "next";
import { SignupForm } from "@/components/auth/SignupForm";

export const metadata: Metadata = {
  title: "Create Account",
  description: "Create a new account",
};

export default function SignupPage() {
  return (
    <>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-cms-text tracking-tight">
          Create an account
        </h1>
        <p className="mt-1 text-sm text-cms-text-2">
          Get started — it only takes a minute.
        </p>
      </div>

      <SignupForm />
    </>
  );
}
