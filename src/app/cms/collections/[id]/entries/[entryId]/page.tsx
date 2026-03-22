import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getEntryById } from "@/lib/actions/entries";
import { getTags, getEntryTags } from "@/lib/actions/tags";
import { EntryEditor } from "@/components/editor/EntryEditor";

type Props = { params: Promise<{ id: string; entryId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { entryId } = await params;
  const result = await getEntryById(entryId);
  if (!result) return { title: "Entry not found" };
  return { title: `Edit: ${result.entry.slug} — pwk-cms` };
}

export default async function EditorPage({ params }: Props) {
  const { entryId } = await params;
  const result = await getEntryById(entryId);
  if (!result) notFound();

  // getTags is now collection-scoped
  const [allTags, entryTags] = await Promise.all([
    getTags(result.collection.id),
    getEntryTags(entryId),
  ]);

  return (
    <EntryEditor
      entry={result.entry}
      collection={result.collection}
      fields={result.fields}
      allTags={allTags}
      entryTags={entryTags}
    />
  );
}
