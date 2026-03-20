import type { Metadata } from "next";
import { getTags } from "@/lib/actions/tags";
import { TagsClient } from "@/components/tags/TagsClient";

export const metadata: Metadata = { title: "Tags — pwk-cms" };

export default async function TagsPage() {
  const allTags = await getTags();
  return <TagsClient initialTags={allTags} />;
}
