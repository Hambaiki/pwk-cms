import type { Metadata } from "next";
import { CollectionForm } from "@/components/collections/CollectionForm";

export const metadata: Metadata = { title: "New collection — pwk-cms" };

export default function NewCollectionPage() {
  return (
    <div className="p-8 mx-auto">
      <div className="mb-8">
        <h1 className="text-lg font-medium text-cms-text">New collection</h1>
        <p className="font-mono text-[11px] text-cms-text-3 mt-1">
          Give your content type a name and we'll set up the rest.
        </p>
      </div>
      <CollectionForm mode="create" />
    </div>
  );
}
