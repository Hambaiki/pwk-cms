import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { verifySession } from "@/lib/dal";
import { Sidebar } from "@/components/shell/Sidebar";
import { Topbar } from "@/components/shell/Topbar";

export default async function CMSLayout({ children }: { children: ReactNode }) {
  // Gate the entire CMS behind authentication.
  // verifySession() redirects to /login if not authenticated.
  await verifySession();

  return (
    <div className="cms-shell">
      <Sidebar />
      <div className="cms-main">
        <Topbar />
        <main className="cms-content">{children}</main>
      </div>
    </div>
  );
}
