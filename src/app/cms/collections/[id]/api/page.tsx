import { notFound } from "next/navigation";
import { headers } from "next/headers";
import type { Metadata } from "next";
import { getCollectionById } from "@/lib/actions/collections";
import { ApiDocsClient } from "@/components/settings/ApiDocsClient";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const result = await getCollectionById(id);
  return {
    title: result ? `API — ${result.collection.name} — pwk-cms` : "Not found",
  };
}

export default async function ApiDocsPage({ params }: Props) {
  const { id } = await params;
  const result = await getCollectionById(id);
  if (!result) notFound();

  // Derive the request origin server-side to avoid window hydration mismatch
  const headersList = await headers();
  const host = headersList.get("host") ?? "localhost:3000";
  const protocol =
    host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https";
  const origin = `${protocol}://${host}`;

  return (
    <ApiDocsClient
      collection={result.collection}
      fields={result.fields}
      origin={origin}
    />
  );
}
