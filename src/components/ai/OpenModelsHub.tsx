"use client";

import { ModelCard } from "@/components/ai/ModelCard";
import type { AiModel } from "@/lib/ai/types";
import Link from "next/link";
import { useEffect, useState } from "react";

export function OpenModelsHub() {
  const [models, setModels] = useState<AiModel[]>([]);
  const [ollamaConfigured, setOllamaConfigured] = useState(false);

  useEffect(() => {
    fetch("/api/ai/models")
      .then((r) => r.json())
      .then((data) => {
        setModels((data.models ?? []).filter((m: AiModel) => m.local || m.openWeight));
        setOllamaConfigured(Boolean(data.ollamaConfigured));
      })
      .catch(() => {});
  }, []);

  const connected = models.filter((m) => m.healthStatus === "connected").length;

  return (
    <div className="open-models">
      <header className="open-models__hero">
        <p className="eyebrow">Open Models</p>
        <h1 className="open-models__title">Powerful AI you can run yourself.</h1>
        <p className="open-models__subtitle">
          Connect local and open-weight models with <strong>no per-message API credits</strong>.
          Hosting still has infrastructure and electricity costs.
        </p>
        <div className="open-models__stats">
          <span>{connected} connected</span>
          <span>{models.length} in registry</span>
          <span>{ollamaConfigured ? "Ollama configured" : "Set OLLAMA_BASE_URL"}</span>
        </div>
        <Link href="/copilot" className="btn btn-primary mt-6">Open AI Copilot</Link>
      </header>

      <section className="open-models__free">
        <h2 className="section-title">FREE LOCAL AI</h2>
        <p className="text-sm text-[var(--text-secondary)]">
          Runs on your configured self-hosted AI server. <strong>No per-message API credits.</strong>
          Server/infrastructure costs still apply.
        </p>
      </section>

      <div className="open-models__grid">
        {models.map((model) => (
          <ModelCard key={model.id} model={model} />
        ))}
      </div>

      <section className="open-models__routing mt-12">
        <h2 className="section-title">Auto Mode routing</h2>
        <ul className="open-models__routes">
          <li>Simple question → Fast Local</li>
          <li>Coding → Devstral / Qwen coding</li>
          <li>Complex reasoning → DeepSeek-R1 / gpt-oss</li>
          <li>Private documents → local model (Private Mode)</li>
          <li>Image understanding → multimodal local (Gemma)</li>
        </ul>
      </section>
    </div>
  );
}
