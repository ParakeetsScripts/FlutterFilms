"use client";

import type { AiModel } from "@/lib/ai/types";
import { useEffect, useMemo, useRef, useState } from "react";

export function ModelSelector({
  models,
  value,
  onChange,
  ollamaConnected,
}: {
  models: AiModel[];
  value: string;
  onChange: (id: string) => void;
  ollamaConnected: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = models.find((m) => m.id === value);
  const label = value === "auto" ? "Auto" : selected?.name ?? "Select model";

  const groups = useMemo(() => {
    const cloud = models.filter((m) => !m.local && m.weightClass !== "experimental");
    const open = models.filter((m) => m.local && m.openWeight);
    const experimental = models.filter((m) => m.weightClass === "experimental");
    return { cloud, open, experimental };
  }, [models]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div className="ai-model-selector" ref={ref}>
      <button type="button" className="ai-model-selector__trigger" onClick={() => setOpen((v) => !v)}>
        <span className="ai-model-selector__brand">FlutterFilms AI</span>
        <span className="ai-model-selector__value">{label} ▾</span>
      </button>
      {open && (
        <div className="ai-model-selector__menu">
          <button type="button" className="ai-model-selector__item" onClick={() => { onChange("auto"); setOpen(false); }}>
            <strong>Auto</strong>
            <span>Fast local · reasoning · coding</span>
          </button>
          <p className="ai-model-selector__group">Cloud</p>
          {groups.cloud.map((m) => (
            <button key={m.id} type="button" className="ai-model-selector__item is-disabled" disabled>
              <strong>{m.name}</strong>
              <span>OFFLINE — not configured</span>
            </button>
          ))}
          <p className="ai-model-selector__group">Open Models</p>
          {groups.open.map((m) => (
            <button
              key={m.id}
              type="button"
              className="ai-model-selector__item"
              disabled={m.healthStatus !== "connected"}
              onClick={() => { onChange(m.id); setOpen(false); }}
            >
              <strong>{m.name}</strong>
              <span>{m.healthStatus === "connected" ? "LOCAL • NO API CREDITS" : "OFFLINE"}</span>
            </button>
          ))}
          <p className="ai-model-selector__group">Local</p>
          <div className="ai-model-selector__item">
            <strong>{ollamaConnected ? "🟢 Ollama Connected" : "Ollama Offline"}</strong>
            <span>{ollamaConnected ? "Discovered from OLLAMA_BASE_URL" : "Configure OLLAMA_BASE_URL"}</span>
          </div>
          {groups.experimental.map((m) => (
            <button key={m.id} type="button" className="ai-model-selector__item is-disabled" disabled>
              <strong>{m.name}</strong>
              <span>Experimental / Custom — admin integration required</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
