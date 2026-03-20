import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/dal";
import { LogoutButton } from "@/components/auth/LogoutButton";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  // verifySession() is called inside getCurrentUser() via the DAL.
  // If the user is not authenticated, they are redirected to /auth/login automatically.
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">
      {/* Nav */}
      <header className="border-b border-stone-800 bg-stone-900/60 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="w-4 h-4 text-stone-950"
                aria-hidden="true"
              >
                <path
                  d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <span className="text-sm font-semibold tracking-tight">
              Your App
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-stone-400 hidden sm:block">
              {user?.email}
            </span>
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-5xl px-6 py-12">
        {/* Welcome */}
        <div className="mb-10">
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome back{user?.displayName ? `, ${user.displayName}` : ""}
          </h1>
          <p className="mt-1 text-sm text-stone-500">
            Here&apos;s what&apos;s happening today.
          </p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-10">
          {[
            {
              label: "Account Status",
              value: "Active",
              accent: "text-green-400",
            },
            {
              label: "Member Since",
              value: user?.createdAt
                ? new Date(user.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    year: "numeric",
                  })
                : "—",
              accent: "text-amber-400",
            },
            {
              label: "Role",
              value: user?.role
                ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
                : "User",
              accent: "text-blue-400",
            },
          ].map(({ label, value, accent }) => (
            <div
              key={label}
              className="rounded-xl border border-stone-800 bg-stone-900/60 px-5 py-4"
            >
              <p className="text-xs text-stone-500 uppercase tracking-widest font-medium mb-1">
                {label}
              </p>
              <p className={`text-lg font-semibold ${accent}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* Profile card */}
        <div className="rounded-xl border border-stone-800 bg-stone-900/60 p-6">
          <h2 className="text-sm font-semibold text-stone-300 mb-4 uppercase tracking-widest">
            Profile
          </h2>
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[
              { term: "Display Name", desc: user?.displayName ?? "—" },
              { term: "Email", desc: user?.email ?? "—" },
              {
                term: "User ID",
                desc: user?.id ? `${user.id.slice(0, 8)}…` : "—",
              },
            ].map(({ term, desc }) => (
              <div key={term} className="flex flex-col gap-0.5">
                <dt className="text-xs text-stone-600 uppercase tracking-wider">
                  {term}
                </dt>
                <dd className="text-sm text-stone-200 font-medium">{desc}</dd>
              </div>
            ))}
          </dl>
        </div>
      </main>
    </div>
  );
}
