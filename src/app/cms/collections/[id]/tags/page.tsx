import type { Metadata } from "next";
import { getTags } from "@/lib/actions/tags";
import { getCollectionById } from "@/lib/actions/collections";
import { TagsClient } from "@/components/tags/TagsClient";
import { notFound } from "next/navigation";

export const metadata: Metadata = { title: "Tags — pwk-cms" };

type Props = { params: Promise<{ id: string }> };

export default async function TagsPage({ params }: Props) {
  const { id } = await params;
  const result = await getCollectionById(id);
  if (!result) notFound();

  const { collection, fields, role } = result;

  const allTags = await getTags(id);

  return <TagsClient collectionId={collection.id} initialTags={allTags} />;
}
