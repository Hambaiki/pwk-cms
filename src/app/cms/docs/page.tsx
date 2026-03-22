import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "API Documentation — pwk-cms" };

const CodeBlock = ({ code, lang = "json" }: { code: string; lang?: string }) => (
  <div className="relative rounded-cms-lg border border-cms-border bg-cms-bg overflow-hidden">
    <div className="flex items-center justify-between px-4 py-2 border-b border-cms-border">
      <span className="font-mono text-xs tracking-[0.07em] uppercase text-cms-text-3">
        {lang}
      </span>
    </div>
    <pre className="overflow-x-auto px-4 py-4 font-mono text-sm text-cms-text-2 leading-relaxed whitespace-pre">
      {code}
    </pre>
  </div>
);

export default function ApiDocsPage() {
  return (
    <div className="p-8 mx-auto max-w-3xl space-y-10">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-medium text-cms-text mb-2">
          API Documentation
        </h1>
        <p className="font-mono text-sm text-cms-text-3">
          Complete guide to using the pwk-cms API.
        </p>
      </div>

      {/* Authentication */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-medium text-cms-text mb-1">
            Authentication
          </h2>
          <p className="font-mono text-sm text-cms-text-3">
            Include your API key in the Authorization header:
          </p>
        </div>
        <CodeBlock
          code={`Authorization: Bearer YOUR_API_KEY`}
          lang="text"
        />
        <p className="font-mono text-sm text-cms-text-3">
          Get API keys from your collection's API Keys settings page.
        </p>
      </section>

      {/* Base URL */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-medium text-cms-text mb-1">
            Base URL
          </h2>
          <p className="font-mono text-sm text-cms-text-3">
            All requests are made to:
          </p>
        </div>
        <CodeBlock
          code={`https://${typeof window !== "undefined" ? window.location.host : "your-site.com"}/api/v1`}
          lang="text"
        />
      </section>

      {/* Endpoints */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-medium text-cms-text mb-1">
            Endpoints
          </h2>
          <p className="font-mono text-sm text-cms-text-3">
            Each collection has its own endpoint. See the API section of your collection for specific routes and details.
          </p>
        </div>

        <div className="space-y-3">
          <div className="rounded-cms-lg border border-cms-border bg-cms-surface p-4">
            <p className="font-mono text-xs font-medium text-cms-text tracking-widest uppercase mb-2">
              GET
            </p>
            <code className="font-mono text-sm text-cms-text-2">
              /api/v1/{'<collection-slug>'}
            </code>
            <p className="font-mono text-sm text-cms-text-3 mt-2">
              Fetch entries from a collection
            </p>
          </div>

          <div className="rounded-cms-lg border border-cms-border bg-cms-surface p-4">
            <p className="font-mono text-xs font-medium text-cms-text tracking-widest uppercase mb-2">
              GET
            </p>
            <code className="font-mono text-sm text-cms-text-2">
              /api/v1/{'<collection-slug>/<entry-slug>'}
            </code>
            <p className="font-mono text-sm text-cms-text-3 mt-2">
              Fetch a specific entry
            </p>
          </div>

          <div className="rounded-cms-lg border border-cms-border bg-cms-surface p-4">
            <p className="font-mono text-xs font-medium text-cms-text tracking-widest uppercase mb-2">
              POST
            </p>
            <code className="font-mono text-sm text-cms-text-2">
              /api/v1/{'<collection-slug>'}
            </code>
            <p className="font-mono text-sm text-cms-text-3 mt-2">
              Create a new entry (requires private key)
            </p>
          </div>

          <div className="rounded-cms-lg border border-cms-border bg-cms-surface p-4">
            <p className="font-mono text-xs font-medium text-cms-text tracking-widest uppercase mb-2">
              PUT
            </p>
            <code className="font-mono text-sm text-cms-text-2">
              /api/v1/{'<collection-slug>/<entry-slug>'}
            </code>
            <p className="font-mono text-sm text-cms-text-3 mt-2">
              Update an entry (requires private key)
            </p>
          </div>

          <div className="rounded-cms-lg border border-cms-border bg-cms-surface p-4">
            <p className="font-mono text-xs font-medium text-cms-text tracking-widest uppercase mb-2">
              DELETE
            </p>
            <code className="font-mono text-sm text-cms-text-2">
              /api/v1/{'<collection-slug>/<entry-slug>'}
            </code>
            <p className="font-mono text-sm text-cms-text-3 mt-2">
              Delete an entry (requires private key)
            </p>
          </div>
        </div>
      </section>

      {/* Key types */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-medium text-cms-text mb-1">
            API Key Types
          </h2>
        </div>

        <div className="space-y-3">
          <div className="rounded-cms-lg border border-[rgba(29,158,117,0.3)] bg-[rgba(29,158,117,0.05)] p-4">
            <p className="font-mono text-xs font-medium text-[#1D9E75] tracking-widest uppercase mb-2">
              Public Keys
            </p>
            <p className="font-mono text-sm text-cms-text-3">
              Can only read published entries. Safe for frontend applications.
            </p>
          </div>

          <div className="rounded-cms-lg border border-[rgba(83,74,183,0.3)] bg-[rgba(83,74,183,0.05)] p-4">
            <p className="font-mono text-xs font-medium text-[#7F77DD] tracking-widest uppercase mb-2">
              Private Keys
            </p>
            <p className="font-mono text-sm text-cms-text-3">
              Full read/write access. Never expose in client code or version control.
            </p>
          </div>
        </div>
      </section>

      {/* Collection-specific docs */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-medium text-cms-text mb-1">
            Collection API Details
          </h2>
          <p className="font-mono text-sm text-cms-text-3">
            For collection-specific endpoints, request/response examples, and available query parameters, see the API section in your collection settings.
          </p>
        </div>

        <div className="rounded-cms-lg border border-cms-border bg-cms-surface p-4">
          <p className="font-mono text-xs text-cms-text-3 mb-3">
            Navigate to any collection and view the <strong>API</strong> section under Settings for detailed documentation.
          </p>
          <Link
            href="/cms/collections"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-cms border border-cms-border bg-transparent text-cms-text-2 font-mono text-xs hover:border-cms-accent transition-colors no-underline"
          >
            Go to Collections
            <svg
              viewBox="0 0 16 16"
              fill="none"
              width="12"
              height="12"
            >
              <path
                d="M6 3l5 5-5 5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        </div>
      </section>

      {/* Errors */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-medium text-cms-text mb-1">
            Error Handling
          </h2>
        </div>

        <div className="space-y-3">
          <div className="rounded-cms-lg border border-cms-border bg-cms-surface p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-sm font-medium text-cms-text">
                200 OK
              </span>
              <span className="font-mono text-xs px-2 py-1 rounded border border-[rgba(29,158,117,0.3)] bg-[rgba(29,158,117,0.05)] text-[#1D9E75]">
                Success
              </span>
            </div>
            <p className="font-mono text-sm text-cms-text-3">
              Request was successful.
            </p>
          </div>

          <div className="rounded-cms-lg border border-cms-border bg-cms-surface p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-sm font-medium text-cms-text">
                400 Bad Request
              </span>
              <span className="font-mono text-xs px-2 py-1 rounded border border-cms-accent/30 bg-cms-accent/5 text-cms-accent">
                Client Error
              </span>
            </div>
            <p className="font-mono text-sm text-cms-text-3">
              Invalid request syntax or parameters.
            </p>
          </div>

          <div className="rounded-cms-lg border border-cms-border bg-cms-surface p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-sm font-medium text-cms-text">
                401 Unauthorized
              </span>
              <span className="font-mono text-xs px-2 py-1 rounded border border-cms-accent/30 bg-cms-accent/5 text-cms-accent">
                Client Error
              </span>
            </div>
            <p className="font-mono text-sm text-cms-text-3">
              Missing or invalid API key.
            </p>
          </div>

          <div className="rounded-cms-lg border border-cms-border bg-cms-surface p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-sm font-medium text-cms-text">
                403 Forbidden
              </span>
              <span className="font-mono text-xs px-2 py-1 rounded border border-cms-accent/30 bg-cms-accent/5 text-cms-accent">
                Client Error
              </span>
            </div>
            <p className="font-mono text-sm text-cms-text-3">
              Insufficient permissions for this operation.
            </p>
          </div>

          <div className="rounded-cms-lg border border-cms-border bg-cms-surface p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-sm font-medium text-cms-text">
                404 Not Found
              </span>
              <span className="font-mono text-xs px-2 py-1 rounded border border-cms-accent/30 bg-cms-accent/5 text-cms-accent">
                Client Error
              </span>
            </div>
            <p className="font-mono text-sm text-cms-text-3">
              Resource not found.
            </p>
          </div>

          <div className="rounded-cms-lg border border-cms-border bg-cms-surface p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-sm font-medium text-cms-text">
                500 Internal Server Error
              </span>
              <span className="font-mono text-xs px-2 py-1 rounded border border-[rgba(224,80,80,0.35)] bg-cms-danger-dim text-cms-danger">
                Server Error
              </span>
            </div>
            <p className="font-mono text-sm text-cms-text-3">
              An unexpected error occurred.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
