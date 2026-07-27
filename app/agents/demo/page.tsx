"use client";

import { useState } from "react";

export default function AgentDemoPage() {
  const [message, setMessage] = useState(
    "Show course seat statistics (read-only)",
  );
  const [out, setOut] = useState<string>("");
  const [loading, setLoading] = useState(false);

  async function run() {
    setLoading(true);
    setOut("");
    try {
      // Public sandbox: hits a limited demo route that never writes production content
      const res = await fetch("/api/agent/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const data = await res.json();
      setOut(JSON.stringify(data, null, 2));
    } catch (e) {
      setOut(String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container-page py-16 max-w-2xl">
      <h1 className="font-[family-name:var(--font-display)] text-4xl">
        Agent sandbox
      </h1>
      <p className="mt-4 text-fg-muted">
        Propose a request. The demo only allows read-only stats and shows how
        destructive writes stop at the approval gate — it cannot change live
        enrollments or payments.
      </p>
      <textarea
        className="mt-6 w-full rounded-md border border-border bg-bg px-3 py-2"
        rows={4}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <button
        type="button"
        onClick={run}
        disabled={loading}
        className="mt-4 min-h-11 rounded-md bg-accent px-5 text-bg disabled:opacity-60"
      >
        {loading ? "Running…" : "Propose"}
      </button>
      {out && (
        <pre className="mt-6 overflow-x-auto rounded-lg border border-border p-4 text-xs text-fg-muted">
          {out}
        </pre>
      )}
    </div>
  );
}
