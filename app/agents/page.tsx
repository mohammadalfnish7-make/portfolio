import Link from "next/link";
import { getPublicChangeLog } from "@/lib/queries";

export const metadata = { title: "Agents" };

export default async function AgentsPage() {
  const log = await getPublicChangeLog(25);

  return (
    <div className="container-page py-16">
      <h1 className="font-[family-name:var(--font-display)] text-4xl">
        Agents
      </h1>
      <p className="mt-4 max-w-2xl text-fg-muted">
        This site is operated partly by agents — content changes go through an
        approval gate; code changes open pull requests. Watch the public feed
        below, try the sandbox, or read the architecture.
      </p>
      <div className="mt-8 flex flex-wrap gap-4">
        <Link
          href="/agents/demo"
          className="rounded-md bg-accent px-5 py-3 text-bg"
        >
          Sandbox demo
        </Link>
        <Link
          href="/architecture"
          className="rounded-md border border-border px-5 py-3"
        >
          Architecture
        </Link>
      </div>

      <h2 className="mt-14 font-[family-name:var(--font-display)] text-2xl">
        Activity feed
      </h2>
      <ul className="mt-6 space-y-3">
        {log.map((row) => (
          <li
            key={row.id}
            className="rounded-lg border border-border px-4 py-3 text-sm"
          >
            <span className="text-fg-muted">
              {row.createdAt.toISOString().slice(0, 16).replace("T", " ")}
            </span>{" "}
            · <span className="text-accent">{row.action}</span> on {row.entity}
          </li>
        ))}
        {log.length === 0 && (
          <li className="text-fg-muted text-sm">
            No public agent activity yet.
          </li>
        )}
      </ul>
    </div>
  );
}
