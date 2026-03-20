import type { Metadata } from "next";
import { getApiKeys } from "@/lib/actions/apiKeys";
import { CreateKeyForm } from "@/components/settings/CreateKeyForm";
import { ApiKeyList } from "@/components/settings/ApiKeyList";

export const metadata: Metadata = { title: "API keys — pwk-cms" };

export default async function ApiKeysPage() {
  const keys = await getApiKeys();

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-lg font-medium text-cms-text mb-1.5">API keys</h1>
        <p className="font-mono text-[11px] text-cms-text3 leading-relaxed">
          Public keys are safe to expose in frontend code — they can only read
          published content. Private keys have full read/write access and must
          never be committed or sent to a browser.
        </p>
      </div>

      <ApiKeyList keys={keys} />

      <div className="my-8 border-t border-cms-border" />

      <div>
        <p className="font-mono text-[10px] tracking-[0.1em] uppercase text-cms-text3 mb-4">
          Generate new key
        </p>
        <div className="rounded-cms-lg border border-cms-border bg-cms-surface p-5">
          <CreateKeyForm />
        </div>
      </div>
    </div>
  );
}
