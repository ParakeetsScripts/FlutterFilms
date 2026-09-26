"use client";

import { useCallback, useEffect, useState } from "react";

type ReleaseCheck = { id: string; label: string; status: string; detail: string };
type EnvCheck = { name: string; status: string; detail: string; category: string };

const STATUS_COLOR: Record<string, string> = {
  READY: "text-emerald-300",
  WARNING: "text-amber-300",
  BLOCKED: "text-orange-300",
  ERROR: "text-red-300",
  MISSING: "text-orange-300",
  INVALID: "text-red-300",
  OPTIONAL: "text-[var(--text-muted)]",
};

export function AdminReleaseDashboard() {
  const [data, setData] = useState<{
    checks: ReleaseCheck[];
    summary: Record<string, number>;
    environment: EnvCheck[];
    envSummary: Record<string, number>;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState("");

  const load = useCallback(async () => {
    setError(null);
    const response = await fetch("/api/admin/release", {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error ?? "Failed to load release status");
      return;
    }
    setData(payload);
  }, [token]);

  useEffect(() => {
    void load();
    const timer = setInterval(() => void load(), 60_000);
    return () => clearInterval(timer);
  }, [load]);

  if (error) {
    return (
      <div className="ai-usage-card space-y-4">
        <p className="text-sm text-red-300">{error}</p>
        <input value={token} onChange={(e) => setToken(e.target.value)} className="w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2" type="password" placeholder="Admin secret" />
        <button type="button" className="btn btn-primary" onClick={load}>Retry</button>
      </div>
    );
  }

  if (!data) return <p className="text-sm text-[var(--text-muted)]">Loading release checks…</p>;

  return (
    <div className="space-y-10">
      <section>
        <h2 className="section-title">System health</h2>
        <div className="mb-6 mt-4 grid gap-4 md:grid-cols-4">
          {Object.entries(data.summary).map(([key, value]) => (
            <div key={key} className="ai-usage-card"><p className="text-xs uppercase text-[var(--muted)]">{key}</p><p className="mt-2 text-2xl font-semibold">{value}</p></div>
          ))}
        </div>
        <div className="space-y-3">
          {data.checks.map((check) => (
            <div key={check.id} className="ai-usage-card flex flex-wrap justify-between gap-3">
              <div><p className="font-medium">{check.label}</p><p className="mt-1 text-sm text-[var(--text-secondary)]">{check.detail}</p></div>
              <span className={`text-sm font-semibold uppercase ${STATUS_COLOR[check.status] ?? ""}`}>{check.status}</span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="section-title">Environment audit</h2>
        <p className="text-sm text-[var(--text-muted)]">Secret values are never displayed.</p>
        <div className="mb-6 mt-4 grid gap-4 md:grid-cols-4">
          {Object.entries(data.envSummary).map(([key, value]) => (
            <div key={key} className="ai-usage-card"><p className="text-xs uppercase text-[var(--muted)]">{key}</p><p className="mt-2 text-2xl font-semibold">{value}</p></div>
          ))}
        </div>
        <div className="space-y-2">
          {data.environment.map((env) => (
            <div key={env.name} className="ai-usage-card flex flex-wrap justify-between gap-2 text-sm">
              <div>
                <span className="font-mono text-[var(--accent-soft)]">{env.name}</span>
                <span className="ml-2 text-[var(--text-muted)]">({env.category})</span>
                <p className="mt-1 text-[var(--text-secondary)]">{env.detail}</p>
              </div>
              <span className={`font-semibold uppercase ${STATUS_COLOR[env.status] ?? ""}`}>{env.status}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
