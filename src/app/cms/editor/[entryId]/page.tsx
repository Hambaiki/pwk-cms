import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getEntryById } from "@/lib/actions/entries";
import { getTags, getEntryTags } from "@/lib/actions/tags";
import { EntryEditor } from "@/components/editor/EntryEditor";

type Props = { params: Promise<{ entryId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { entryId } = await params;
  const result = await getEntryById(entryId);
  if (!result) return { title: "Entry not found" };
  return { title: `Edit: ${result.entry.slug} — pwk-cms` };
}

export default async function EditorPage({ params }: Props) {
  const { entryId } = await params;
  const [result, allTags, entryTags] = await Promise.all([
    getEntryById(entryId),
    getTags(),
    getEntryTags(entryId),
  ]);
  if (!result) notFound();

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
