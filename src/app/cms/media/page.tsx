import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getMedia } from "@/lib/actions/media";
import { getCollectionById } from "@/lib/actions/collections";
import { MediaGrid } from "@/components/media/MediaGrid";

export const metadata: Metadata = { title: "Media — pwk-cms" };

type Props = { searchParams: Promise<{ collection?: string }> };

export default async function MediaPage({ searchParams }: Props) {
  const { collection: collectionId } = await searchParams;

  // Media must be collection-scoped — redirect to collections if no context
  if (!collectionId) redirect("/cms/collections");

  const result = await getCollectionById(collectionId);
  if (!result) redirect("/cms/collections");

  const { items, total } = await getMedia({ collectionId, limit: 80 });

  return (
    <MediaGrid
      initialItems={items}
      initialTotal={total}
      collectionId={collectionId}
      collectionName={result.collection.name}
    />
  );
}
