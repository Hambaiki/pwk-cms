import type { Metadata } from "next";
import { getMedia } from "@/lib/actions/media";
import { MediaGrid } from "@/components/media/MediaGrid";

export const metadata: Metadata = { title: "Media — pwk-cms" };

export default async function MediaPage() {
  const { items, total } = await getMedia({ limit: 80 });

  return <MediaGrid initialItems={items} initialTotal={total} />;
}
