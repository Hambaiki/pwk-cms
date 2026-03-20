import type { Metadata } from "next";
import { getCollections, getDashboardStats } from "@/lib/actions/collections";
import { getCurrentUser } from "@/lib/dal";
import { DashboardClient } from "@/components/shell/DashboardClient";

export const metadata: Metadata = { title: "Dashboard — pwk-cms" };

export default async function CMSDashboardPage() {
  const [user, collections] = await Promise.all([
    getCurrentUser(),
    getCollections(),
  ]);

  const stats = await getDashboardStats(collections.map((c) => c.id));

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <DashboardClient
      user={user}
      collections={collections}
      stats={stats}
      greeting={greeting}
      today={new Date().toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })}
    />
  );
}
