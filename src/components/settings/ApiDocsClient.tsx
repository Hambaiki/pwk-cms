"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { Collection, Field } from "@/lib/db/schema";

type Props = {
  collection: Collection;
  fields: Field[];
  origin: string;
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

function CodeBlock({ code, lang = "json" }: { code: string; lang?: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="relative rounded-cms-lg border border-cms-border bg-cms-bg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-cms-border">
        <span className="font-mono text-[10px] tracking-[0.07em] uppercase text-cms-text3">
          {lang}
        </span>
        <button
          onClick={handleCopy}
          className={cn(
            "font-mono text-[10px] px-2 py-0.5 rounded border transition-colors cursor-pointer",
            copied
              ? "border-[rgba(40,160,90,0.3)] text-[#50c878] bg-cms-success-subtle"
              : "border-cms-border text-cms-text3 hover:border-cms-border2 hover:text-cms-text2",
          )}
        >
          {copied ? "✓ Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto px-4 py-4 font-mono text-[11px] text-cms-text2 leading-relaxed whitespace-pre">
        {code}
      </pre>
    </div>
  );
}

function MethodBadge({
  method,
}: {
  method: "GET" | "POST" | "PATCH" | "DELETE";
}) {
  const colours = {
    GET: "bg-[rgba(29,158,117,0.1)] border-[rgba(29,158,117,0.3)] text-[#1D9E75]",
    POST: "bg-[rgba(83,74,183,0.1)] border-[rgba(83,74,183,0.3)] text-[#7F77DD]",
    PATCH:
      "bg-[rgba(232,160,48,0.1)] border-[rgba(232,160,48,0.3)] text-cms-accent",
    DELETE:
      "bg-[rgba(224,80,80,0.08)] border-[rgba(224,80,80,0.3)] text-cms-danger",
  };
  return (
    <span
      className={cn(
        "font-mono text-[10px] font-medium px-2 py-0.5 rounded border shrink-0",
        colours[method],
      )}
    >
      {method}
    </span>
  );
}

function EndpointRow({
  method,
  path,
  description,
}: {
  method: "GET" | "POST" | "PATCH" | "DELETE";
  path: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3 px-4 py-3 border-b border-cms-border last:border-b-0">
      <MethodBadge method={method} />
      <div className="min-w-0">
        <code className="font-mono text-xs text-cms-text">{path}</code>
        <p className="font-mono text-[11px] text-cms-text3 mt-0.5">
          {description}
        </p>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <h2 className="font-mono text-[10px] tracking-widest uppercase text-cms-text3">
        {title}
      </h2>
      {children}
    </section>
  );
}

// ─── ApiDocsClient ─────────────────────────────────────────────────────────────

export function ApiDocsClient({ collection, fields, origin }: Props) {
  const base = `/api/v1/${collection.slug}`;
  const baseUrl = `${origin}${base}`;

  // Build a representative entry shape from the collection's fields
  const exampleContent = fields.reduce<Record<string, unknown>>((acc, f) => {
    const examples: Record<string, unknown> = {
      text: "Example text",
      textarea: "A longer piece of text content.",
      richtext: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "Rich text block" }],
        },
      ],
      number: 42,
      boolean: true,
      date: "2024-01-15",
      media: "media-uuid-here",
      select: (f.options as { choices?: string[] })?.choices?.[0] ?? "option-1",
      tags: ["tag-slug"],
      relation: "related-entry-id",
    };
    acc[f.slug] = examples[f.type] ?? null;
    return acc;
  }, {});

  const exampleEntry = {
    id: "entry-uuid",
    slug: `example-${collection.slug}`,
    content: exampleContent,
    tags: [{ name: "Example", slug: "example" }],
    publishedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const listResponse = {
    data: [exampleEntry],
    meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
  };

  const createBody = {
    slug: `new-${collection.slug}`,
    content: exampleContent,
    status: "draft",
  };

  return (
    <div className="p-8 mx-auto space-y-10">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <span className="text-2xl">{collection.icon ?? "📄"}</span>
          <h1 className="text-lg font-medium text-cms-text">
            {collection.name} — API Reference
          </h1>
        </div>
        <p className="font-mono text-[11px] text-cms-text3">
          Base URL: <code className="text-cms-text2">{baseUrl}</code>
        </p>
      </div>

      {/* Authentication */}
      <Section title="Authentication">
        <div className="rounded-cms-lg border border-cms-border bg-cms-surface overflow-hidden">
          <div className="px-4 py-3 border-b border-cms-border">
            <p className="font-mono text-xs text-cms-text2">
              Pass your API key in one of two ways:
            </p>
          </div>
          <div className="p-4 space-y-3">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.07em] text-cms-text3 mb-1.5">
                Authorization header
              </p>
              <CodeBlock
                code={`Authorization: Bearer pwk_pub_your_key_here`}
                lang="http"
              />
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.07em] text-cms-text3 mb-1.5">
                X-API-Key header
              </p>
              <CodeBlock
                code={`X-API-Key: pwk_pub_your_key_here`}
                lang="http"
              />
            </div>
          </div>
          <div className="px-4 py-3 border-t border-cms-border bg-cms-surface2 grid grid-cols-2 gap-4">
            <div>
              <p className="font-mono text-[10px] text-cms-accent mb-1">
                Public key <code className="text-cms-text3">pwk_pub_…</code>
              </p>
              <p className="font-mono text-[11px] text-cms-text3">
                Read published entries only. Safe to use in frontend code.
              </p>
            </div>
            <div>
              <p className="font-mono text-[10px] text-[#7F77DD] mb-1">
                Private key <code className="text-cms-text3">pwk_prv_…</code>
              </p>
              <p className="font-mono text-[11px] text-cms-text3">
                Full read/write access. Never expose in client-side code.
              </p>
            </div>
          </div>
        </div>
      </Section>

      {/* Endpoints overview */}
      <Section title="Endpoints">
        <div className="rounded-cms-lg border border-cms-border bg-cms-surface overflow-hidden">
          <EndpointRow
            method="GET"
            path={`${base}`}
            description="List all published entries. Supports ?page=, ?limit=, ?tag= filters."
          />
          <EndpointRow
            method="GET"
            path={`${base}/[slug]`}
            description="Get a single published entry by its slug."
          />
          <EndpointRow
            method="GET"
            path={`/api/v1/tags?collection=${collection.slug}`}
            description="List all tags for this collection."
          />
          <EndpointRow
            method="POST"
            path="/api/v1/admin/entries"
            description="Create a new entry. Requires a private key."
          />
          <EndpointRow
            method="PATCH"
            path="/api/v1/admin/entries/[id]"
            description="Update an entry's slug, content, or status. Requires a private key."
          />
          <EndpointRow
            method="DELETE"
            path="/api/v1/admin/entries/[id]"
            description="Delete an entry permanently. Requires a private key."
          />
        </div>
      </Section>

      {/* List entries */}
      <Section title="GET — List entries">
        <div className="space-y-3">
          <CodeBlock
            code={`GET ${baseUrl}\n\n# With filters\nGET ${baseUrl}?page=1&limit=20&tag=featured`}
            lang="http"
          />
          <p className="font-mono text-[11px] text-cms-text3">Response:</p>
          <CodeBlock code={JSON.stringify(listResponse, null, 2)} lang="json" />
        </div>
      </Section>

      {/* Get single entry */}
      <Section title="GET — Single entry">
        <div className="space-y-3">
          <CodeBlock code={`GET ${baseUrl}/example-slug`} lang="http" />
          <p className="font-mono text-[11px] text-cms-text3">Response:</p>
          <CodeBlock
            code={JSON.stringify({ data: exampleEntry }, null, 2)}
            lang="json"
          />
        </div>
      </Section>

      {/* Create entry */}
      <Section title="POST — Create entry">
        <div className="space-y-3">
          <div className="rounded-cms-lg border border-cms-danger-border bg-[rgba(224,80,80,0.04)] px-4 py-3">
            <p className="font-mono text-[11px] text-cms-danger">
              Requires a private API key.
            </p>
          </div>
          <CodeBlock
            code={`POST https://your-domain.com/api/v1/admin/entries\nContent-Type: application/json\nAuthorization: Bearer pwk_prv_your_key_here`}
            lang="http"
          />
          <p className="font-mono text-[11px] text-cms-text3">Request body:</p>
          <CodeBlock code={JSON.stringify(createBody, null, 2)} lang="json" />
        </div>
      </Section>

      {/* Update entry */}
      <Section title="PATCH — Update entry">
        <div className="space-y-3">
          <div className="rounded-cms-lg border border-cms-danger-border bg-[rgba(224,80,80,0.04)] px-4 py-3">
            <p className="font-mono text-[11px] text-cms-danger">
              Requires a private API key.
            </p>
          </div>
          <CodeBlock
            code={`PATCH https://your-domain.com/api/v1/admin/entries/{id}\nContent-Type: application/json\nAuthorization: Bearer pwk_prv_your_key_here`}
            lang="http"
          />
          <p className="font-mono text-[11px] text-cms-text3">
            Request body (all fields optional):
          </p>
          <CodeBlock
            code={JSON.stringify(
              {
                slug: "new-slug",
                content: exampleContent,
                status: "published",
              },
              null,
              2,
            )}
            lang="json"
          />
        </div>
      </Section>

      {/* Fields reference */}
      {fields.length > 0 && (
        <Section title="Content schema">
          <div className="rounded-cms-lg border border-cms-border bg-cms-surface overflow-hidden">
            <div
              className="grid gap-0"
              style={{ gridTemplateColumns: "1fr 100px 60px 60px" }}
            >
              <div
                className="grid gap-0 col-span-4 grid-cols-subgrid px-4 py-2 border-b border-cms-border bg-cms-surface2 font-mono text-[10px] tracking-[0.07em] uppercase text-cms-text3"
                style={{ display: "contents" }}
              >
                {/* header row */}
              </div>
              <div
                className="grid px-4 py-1.5 border-b border-cms-border font-mono text-[10px] tracking-[0.07em] uppercase text-cms-text3"
                style={{
                  gridColumn: "1",
                  display: "grid",
                  gridTemplateColumns: "subgrid",
                }}
              />
            </div>
            {/* Simple table */}
            <div>
              <div
                className="grid px-4 py-1.5 border-b border-cms-border font-mono text-[10px] tracking-[0.07em] uppercase text-cms-text3"
                style={{ gridTemplateColumns: "1fr 100px 60px 60px" }}
              >
                <span>Field</span>
                <span>Type</span>
                <span>Required</span>
                <span>Multiple</span>
              </div>
              {fields.map((f) => (
                <div
                  key={f.id}
                  className="grid items-center px-4 py-2.5 border-b border-cms-border last:border-b-0"
                  style={{ gridTemplateColumns: "1fr 100px 60px 60px" }}
                >
                  <code className="font-mono text-xs text-cms-text">
                    {f.slug}
                  </code>
                  <span className="font-mono text-[11px] text-cms-text3">
                    {f.type}
                  </span>
                  <span
                    className={cn(
                      "font-mono text-[10px]",
                      f.required ? "text-cms-danger" : "text-cms-text3",
                    )}
                  >
                    {f.required ? "yes" : "—"}
                  </span>
                  <span
                    className={cn(
                      "font-mono text-[10px]",
                      f.multiple ? "text-cms-accent" : "text-cms-text3",
                    )}
                  >
                    {f.multiple ? "yes" : "—"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Section>
      )}

      {/* Response format */}
      <Section title="Response format">
        <div className="rounded-cms-lg border border-cms-border bg-cms-surface overflow-hidden">
          {[
            {
              status: "200 OK",
              desc: "Request succeeded. Body contains { data: ... }.",
            },
            {
              status: "201 Created",
              desc: "Entry was created. Body contains { data: entry }.",
            },
            {
              status: "400 Bad Request",
              desc: 'Validation error. Body contains { error: "message" }.',
            },
            { status: "401 Unauthorized", desc: "Missing or invalid API key." },
            {
              status: "403 Forbidden",
              desc: "Key does not have permission for this operation.",
            },
            { status: "404 Not Found", desc: "Entry or collection not found." },
          ].map(({ status, desc }) => (
            <div
              key={status}
              className="flex items-start gap-4 px-4 py-2.5 border-b border-cms-border last:border-b-0"
            >
              <code className="font-mono text-xs text-cms-text shrink-0 w-32">
                {status}
              </code>
              <p className="font-mono text-[11px] text-cms-text3">{desc}</p>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
