import type { ReactNode } from "react";
import { verifySession } from "@/lib/dal";
import { Sidebar } from "@/components/shell/Sidebar";
import { Topbar } from "@/components/shell/Topbar";

export default async function CMSLayout({ children }: { children: ReactNode }) {
  await verifySession();

  return (
    <div className="flex h-dvh overflow-hidden bg-cms-bg text-cms-text text-base leading-relaxed">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        <Topbar />
        <main
          className="flex-1 overflow-y-auto bg-cms-bg"
          style={{
            backgroundImage:
              "linear-gradient(var(--cms-border) 1px, transparent 1px), linear-gradient(90deg, var(--cms-border) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
