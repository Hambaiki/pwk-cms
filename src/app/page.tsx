import Link from "next/link";
import { BrandIcon } from "@/components/BrandIcon";

export default function Home() {
  return (
    <div className="min-h-screen bg-cms-bg text-cms-text flex items-center justify-center p-6">
      <main className="w-full max-w-5xl rounded-cms-lg border border-cms-border bg-cms-surface p-8">
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <BrandIcon size={36} withText={false} />
            <h1 className="font-serif text-3xl text-cms-text mb-0">
              Welcome to pwk-cms
            </h1>
          </div>
          <p className="font-mono text-sm text-cms-text-2 mt-3">
            Your headless CMS admin dashboard is ready. Use the links below to
            open the dashboard and manage collections, entries, media, members,
            tags, and API keys.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Link
            href="/cms"
            className="rounded-cms-lg border border-cms-border bg-cms-surface-2 p-4 hover:border-cms-accent hover:bg-cms-surface-3 transition-colors"
          >
            <p className="font-mono text-sm font-semibold text-cms-text">
              Dashboard
            </p>
            <p className="text-xs text-cms-text-3 mt-1">
              Overview and stats for your workspace.
            </p>
          </Link>

          <Link
            href="/cms/collections"
            className="rounded-cms-lg border border-cms-border bg-cms-surface-2 p-4 hover:border-cms-accent hover:bg-cms-surface-3 transition-colors"
          >
            <p className="font-mono text-sm font-semibold text-cms-text">
              Collections
            </p>
            <p className="text-xs text-cms-text-3 mt-1">
              Browse collections and related controls.
            </p>
          </Link>

          <Link
            href="/cms/docs"
            className="rounded-cms-lg border border-cms-border bg-cms-surface-2 p-4 hover:border-cms-accent hover:bg-cms-surface-3 transition-colors"
          >
            <p className="font-mono text-sm font-semibold text-cms-text">
              API Documentation
            </p>
            <p className="text-xs text-cms-text-3 mt-1">
              Learn how to use the pwk-cms API.
            </p>
          </Link>

          <Link
            href="/cms/collections/new"
            className="rounded-cms-lg border border-cms-border bg-cms-surface-2 p-4 hover:border-cms-accent hover:bg-cms-surface-3 transition-colors"
          >
            <p className="font-mono text-sm font-semibold text-cms-text">
              New collection
            </p>
            <p className="text-xs text-cms-text-3 mt-1">
              Create a new collection to structure content.
            </p>
          </Link>
        </div>

        <div className="mt-8 border-t border-cms-border pt-3 text-xs text-cms-text-3">
          <p>
            If needed, sign in first:{" "}
            <Link href="/login" className="text-cms-accent hover:underline">
              /login
            </Link>{" "}
            or{" "}
            <Link href="/signup" className="text-cms-accent hover:underline">
              /signup
            </Link>
            .
          </p>
          <p className="mt-1">
            Then proceed to{" "}
            <Link href="/cms" className="text-cms-accent hover:underline">
              /cms
            </Link>{" "}
            for the full CMS UI.
          </p>
        </div>
      </main>
    </div>
  );
}
