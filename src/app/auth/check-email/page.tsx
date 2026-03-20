import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Check your email",
};

export default function CheckEmailPage() {
  return (
    <div className="min-h-screen bg-stone-950 flex items-center justify-center p-4">
      <div className="relative w-full max-w-md text-center">
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 overflow-hidden"
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 h-100 w-100 rounded-full bg-amber-500/5 blur-[100px]" />
        </div>

        <div className="relative rounded-2xl border border-stone-800 bg-stone-900/60 backdrop-blur-sm p-10 shadow-2xl shadow-black/50">
          {/* Icon */}
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10 border border-amber-500/20">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-7 w-7 text-amber-400"
              aria-hidden="true"
            >
              <path
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <h1 className="text-xl font-bold text-stone-100 tracking-tight">
            Check your email
          </h1>
          <p className="mt-2 text-sm text-stone-500 leading-relaxed">
            We sent you a confirmation link. Click it to activate your account
            and get started.
          </p>

          <p className="mt-6 text-xs text-stone-600">
            Didn&apos;t get it? Check your spam folder or{" "}
            <Link
              href="/auth/signup"
              className="text-amber-400 hover:underline underline-offset-4 transition-colors"
            >
              try again
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
