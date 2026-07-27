import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getAnalyticsSummary } from "@/lib/queries";

export default async function AnalyticsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/auth/login");
  }

  const { daily, topPaths, topEvents } = await getAnalyticsSummary(30);
  const viewsByDay = daily.reduce<Record<string, number>>((acc, row) => {
    const key = row.date.toISOString().slice(0, 10);
    acc[key] = (acc[key] ?? 0) + row.views;
    return acc;
  }, {});

  return (
    <div className="container-page py-12">
      <div className="flex items-center justify-between">
        <h1 className="font-[family-name:var(--font-display)] text-3xl">
          Analytics
        </h1>
        <Link href="/admin" className="text-sm text-accent">
          ← Admin
        </Link>
      </div>

      <h2 className="mt-10 text-lg">Views by day (rollup)</h2>
      <ul className="mt-4 space-y-1 text-sm text-fg-muted">
        {Object.entries(viewsByDay).map(([day, views]) => (
          <li key={day} className="flex justify-between border-b border-border/50 py-1">
            <span>{day}</span>
            <span>{views}</span>
          </li>
        ))}
        {Object.keys(viewsByDay).length === 0 && (
          <li>No rollup data yet — run tasks:rollup after traffic arrives.</li>
        )}
      </ul>

      <h2 className="mt-10 text-lg">Top paths</h2>
      <ul className="mt-4 space-y-1 text-sm">
        {topPaths.map((p) => (
          <li key={p.path} className="flex justify-between">
            <span className="text-fg-muted">{p.path}</span>
            <span>{p._count._all}</span>
          </li>
        ))}
      </ul>

      <h2 className="mt-10 text-lg">Top clicks</h2>
      <ul className="mt-4 space-y-1 text-sm">
        {topEvents.map((e, i) => (
          <li key={`${e.name}-${e.target}-${i}`} className="flex justify-between">
            <span className="text-fg-muted">
              {e.name}: {e.target}
            </span>
            <span>{e._count._all}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
