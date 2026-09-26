"use client";

import { ModelCard } from "@/components/ai/ModelCard";
import type { AiModel } from "@/lib/ai/types";
import { useEffect, useState } from "react";

export default function AdminModelsPage() {
  const [models, setModels] = useState<AiModel[]>([]);
  const [usage, setUsage] = useState<{ cloud: { requests: number }; selfHosted: { requests: number; apiCostUsd: number } } | null>(null);
  const [ollamaModels, setOllamaModels] = useState<Array<{ name: string; size: number }>>([]);
  const [secret, setSecret] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    const response = await fetch("/api/admin/models", {
      headers: secret ? { Authorization: `Bearer ${secret}` } : undefined,
    });
    if (!response.ok) {
      setMessage("Admin access required. Set AI_ADMIN_SECRET or CRON_SECRET.");
      return;
    }
    const data = await response.json();
    setModels(data.models ?? []);
    setUsage(data.usage ?? null);
    setOllamaModels(data.ollamaModels ?? []);
    setMessage(null);
  }

  useEffect(() => {
    load().catch(() => {});
  }, []);

  async function testConnection(provider: string) {
    const response = await fetch("/api/admin/models/test", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(secret ? { Authorization: `Bearer ${secret}` } : {}),
      },
      body: JSON.stringify({ provider }),
    });
    const data = await response.json();
    setMessage(data.ok ? `Connected (${data.latencyMs}ms)` : data.error);
    await load();
  }

  async function testModel(modelId: string) {
    const response = await fetch("/api/admin/models/test-model", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(secret ? { Authorization: `Bearer ${secret}` } : {}),
      },
      body: JSON.stringify({ modelId }),
    });
    const data = await response.json();
    setMessage(data.ok ? `Model OK (${data.latencyMs}ms): ${data.snippet}` : data.error);
  }

  return (
    <div className="page-container page-section max-w-6xl">
      <header className="page-header">
        <p className="eyebrow">Admin</p>
        <h1 className="page-header__title">AI Models</h1>
        <p className="page-header__subtitle">Provider health, Ollama discovery, and usage separation.</p>
      </header>

      <div className="mt-6 flex flex-wrap gap-3 items-end">
        <label className="block">
          <span className="text-xs text-[var(--text-muted)]">Admin secret</span>
          <input value={secret} onChange={(e) => setSecret(e.target.value)} className="mt-1 rounded border border-[var(--border)] bg-[var(--bg-1)] px-3 py-2" />
        </label>
        <button type="button" className="btn btn-secondary" onClick={() => testConnection("ollama")}>Test Ollama</button>
        <button type="button" className="btn btn-secondary" onClick={() => testConnection("local_openai")}>Test Local Endpoint</button>
        <button type="button" className="btn btn-ghost" onClick={load}>Refresh</button>
      </div>
      {message && <p className="mt-4 text-sm text-[var(--accent-soft)]">{message}</p>}

      {usage && (
        <section className="mt-10 grid gap-4 md:grid-cols-2">
          <article className="ai-usage-card">
            <h2>Cloud API Usage</h2>
            <p>{usage.cloud.requests} requests</p>
            <p className="text-sm text-[var(--text-muted)]">API Cost: not configured</p>
          </article>
          <article className="ai-usage-card">
            <h2>Self-Hosted Usage</h2>
            <p>{usage.selfHosted.requests} requests</p>
            <p className="text-sm text-[var(--text-muted)]">API Cost: $0 · Infrastructure: Self-hosted</p>
          </article>
        </section>
      )}

      {ollamaModels.length > 0 && (
        <section className="mt-10">
          <h2 className="section-title">Ollama installed models</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {ollamaModels.map((m) => (
              <li key={m.name}>{m.name} · {(m.size / 1_073_741_824).toFixed(1)} GB</li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-10 grid gap-4 md:grid-cols-2">
        {models.map((model) => (
          <div key={model.id}>
            <ModelCard model={model} />
            <button type="button" className="btn btn-ghost mt-2 text-sm" onClick={() => testModel(model.id)}>
              Test model
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
