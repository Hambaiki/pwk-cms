import type { ReactNode } from "react";
import { BrandIcon } from "@/components/BrandIcon";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {/* Ambient background glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 overflow-hidden"
      >
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-125 w-125 rounded-full bg-cms-accent-subtle blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-75 w-75 rounded-full bg-cms-accent-subtle blur-[100px]" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo / Brand */}
        <div className="mb-8 text-center">
          <BrandIcon size={40} withText={false} className="shadow-sm" />
          <p className="text-xs tracking-[0.2em] uppercase text-cms-text-3 font-medium mt-2">
            pwk-cms
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-cms-border bg-cms-surface/80 backdrop-blur-sm p-8 shadow-2xl shadow-black/40">
          {children}
        </div>
      </div>
    </div>
  );
}
