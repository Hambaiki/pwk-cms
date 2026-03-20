import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Check your email",
};

export default function CheckEmailPage() {
  return (
    <div className="min-h-screen bg-cms-bg flex items-center justify-center p-4">
      <div className="relative w-full max-w-md text-center">
        {/* Ambient glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 overflow-hidden"
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 h-100 w-100 rounded-full bg-cms-accent-subtle blur-[100px]" />
        </div>

        {/* Card */}
        <div className="relative rounded-2xl border border-cms-border bg-cms-surface/80 backdrop-blur-sm p-10 shadow-2xl shadow-black/40">
          {/* Icon */}
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-cms-accent-subtle border border-cms-accent-border">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-7 w-7 text-cms-accent"
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

          {/* Title */}
          <h1 className="text-xl font-bold text-cms-text tracking-tight">
            Check your email
          </h1>

          {/* Description */}
          <p className="mt-2 text-sm text-cms-text-2 leading-relaxed">
            We sent you a confirmation link. Click it to activate your account
            and get started.
          </p>

          {/* Footer */}
          <p className="mt-6 text-xs text-cms-text-3">
            Didn&apos;t get it? Check your spam folder or{" "}
            <Link
              href="/signup"
              className="text-cms-accent hover:underline underline-offset-4 transition-colors"
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
