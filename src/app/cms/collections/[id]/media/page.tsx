import type { Metadata } from "next";
import { getMedia } from "@/lib/actions/media";
import { getCollectionById } from "@/lib/actions/collections";
import { notFound } from "next/navigation";
import { MediaGrid } from "@/components/media/MediaGrid";

export const metadata: Metadata = { title: "Media — pwk-cms" };

type Props = { params: Promise<{ id: string }> };

export default async function MediaPage({ params }: Props) {
  const { id } = await params;

  const result = await getCollectionById(id);
  if (!result) notFound();

  const { items, total } = await getMedia({ collectionId: id, limit: 80 });

  return (
    <MediaGrid
      initialItems={items}
      initialTotal={total}
      collectionId={id}
      collectionName={result.collection.name}
    />
  );
}
