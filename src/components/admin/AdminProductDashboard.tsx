"use client";

import { useCallback, useEffect, useState } from "react";

type AnalyticsRange = "today" | "7d" | "30d" | "90d" | "all";

type Dashboard = {
  range: AnalyticsRange;
  lastUpdated: string;
  eventCount: number;
  insufficientData: boolean;
  disclaimer: string;
  driver: string;
  registeredUsers: number;
  acquisition: { visitors: number; sessions: number; newUsers: number; returningUsers: number };
  activation: {
    activationRate: string;
    insufficientData: boolean;
    retention: Record<string, string>;
    funnel: { signups: number; activated: number; returned: number; social: number };
  };
  engagement: { dau: number; wau: number; mau: number; movieViews: number; searches: number; aiSessions: number; sessionDepth: number };
  social: { roomsCreated: number; roomJoins: number; roomVotes: number; sharedLists: number; sharedListMovies: number };
  ai: { prompts: number; responses: number; toolCalls: number; recommendations: number };
  funnel: { visitors: number; searches: number; movieViews: number; aiInteraction: number; saves: number; returns: number };
  eventBreakdown: Array<{ event_name: string; count: number }>;
};

const RANGES: AnalyticsRange[] = ["today", "7d", "30d", "90d", "all"];

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="ai-usage-card">
      <p className="text-xs uppercase text-[var(--muted)]">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}

export function AdminProductDashboard() {
  const [metrics, setMetrics] = useState<Dashboard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState("");
  const [range, setRange] = useState<AnalyticsRange>("7d");

  const load = useCallback(async (nextRange = range) => {
    setError(null);
    const response = await fetch(`/api/admin/product?range=${nextRange}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error ?? "Failed to load metrics");
      return;
    }
    setMetrics(data);
  }, [range, token]);

  useEffect(() => {
    void load(range);
    const timer = setInterval(() => void load(range), 30_000);
    return () => clearInterval(timer);
  }, [load, range]);

  if (error) {
    return (
      <div className="ai-usage-card space-y-4">
        <p className="text-sm text-red-300">{error}</p>
        <label className="block text-sm">
          Admin secret
          <input value={token} onChange={(e) => setToken(e.target.value)} className="mt-1 w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2" type="password" />
        </label>
        <button type="button" className="btn btn-primary" onClick={() => load()}>Retry</button>
      </div>
    );
  }

  if (!metrics) return <p className="text-sm text-[var(--text-muted)]">Loading metrics…</p>;

  const maxFunnel = Math.max(1, ...Object.values(metrics.funnel));

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {RANGES.map((r) => (
            <button key={r} type="button" className={`filter-chip ${range === r ? "is-active" : ""}`} onClick={() => setRange(r)}>{r}</button>
          ))}
        </div>
        <p className="text-xs text-[var(--text-muted)]">
          Last updated {new Date(metrics.lastUpdated).toLocaleTimeString()} · {metrics.eventCount} events · {metrics.driver}
        </p>
      </div>
      <p className="mb-6 text-sm text-[var(--text-secondary)]">{metrics.disclaimer}</p>

      <h2 className="section-title">Acquisition</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-4">
        <Metric label="Visitors / sessions" value={metrics.acquisition.sessions} />
        <Metric label="New users" value={metrics.acquisition.newUsers} />
        <Metric label="Returning users" value={metrics.acquisition.returningUsers} />
        <Metric label="Registered" value={metrics.registeredUsers} />
      </div>

      <h2 className="section-title mt-10">Activation</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-4">
        <Metric label="Signups" value={metrics.activation.funnel.signups} />
        <Metric label="Activated" value={metrics.activation.funnel.activated} />
        <Metric label="Activation rate" value={metrics.activation.activationRate} />
        <Metric label="Social activated" value={metrics.activation.funnel.social} />
      </div>
      {metrics.activation.insufficientData && (
        <p className="mt-3 text-sm text-amber-300/90">INSUFFICIENT DATA for D1/D7/D14/D30 retention cohorts.</p>
      )}

      <h2 className="section-title mt-10">Engagement</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <Metric label="DAU" value={metrics.engagement.dau} />
        <Metric label="WAU" value={metrics.engagement.wau} />
        <Metric label="MAU" value={metrics.engagement.mau} />
        <Metric label="Movie views" value={metrics.engagement.movieViews} />
        <Metric label="Searches" value={metrics.engagement.searches} />
        <Metric label="Session depth" value={metrics.engagement.sessionDepth} />
      </div>

      <h2 className="section-title mt-10">Social</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-5">
        <Metric label="Rooms created" value={metrics.social.roomsCreated} />
        <Metric label="Room joins" value={metrics.social.roomJoins} />
        <Metric label="Votes" value={metrics.social.roomVotes} />
        <Metric label="Shared lists" value={metrics.social.sharedLists} />
        <Metric label="List movies added" value={metrics.social.sharedListMovies} />
      </div>

      <h2 className="section-title mt-10">AI</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-4">
        <Metric label="Prompts" value={metrics.ai.prompts} />
        <Metric label="Responses" value={metrics.ai.responses} />
        <Metric label="Tool calls" value={metrics.ai.toolCalls} />
        <Metric label="Recommendation events" value={metrics.ai.recommendations} />
      </div>

      <section className="ai-usage-card mt-10">
        <h2 className="section-title">Product funnel</h2>
        <div className="mt-4 space-y-3">
          {Object.entries(metrics.funnel).map(([key, value]) => (
            <div key={key}>
              <div className="flex justify-between text-sm capitalize">
                <span>{key.replace(/([A-Z])/g, " $1")}</span>
                <span>{value}</span>
              </div>
              <div className="mt-1 h-2 rounded-full bg-[var(--surface-2)]">
                <div className="h-2 rounded-full bg-[var(--accent)]" style={{ width: `${(value / maxFunnel) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="ai-usage-card mt-8">
        <h2 className="section-title">Top events</h2>
        {metrics.eventBreakdown.length ? (
          <ul className="mt-4 max-h-64 space-y-2 overflow-y-auto text-sm">
            {metrics.eventBreakdown.map((e) => (
              <li key={e.event_name} className="flex justify-between"><span>{e.event_name}</span><span>{e.count}</span></li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-amber-300/90">INSUFFICIENT DATA</p>
        )}
      </section>
    </div>
  );
}
