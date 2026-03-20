import type { Metadata } from "next";
import { CollectionForm } from "@/components/collections/CollectionForm";

export const metadata: Metadata = { title: "New collection — pwk-cms" };

export default function NewCollectionPage() {
  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-xl font-medium text-stone-100 tracking-tight">
          New collection
        </h1>
        <p className="text-sm text-stone-500 mt-1">
          Give your content type a name and we'll set up the rest.
        </p>
      </div>
      <CollectionForm mode="create" />
    </div>
  );
}
