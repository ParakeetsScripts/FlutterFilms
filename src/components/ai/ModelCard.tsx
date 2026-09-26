"use client";

import type { AiModel } from "@/lib/ai/types";

function formatSize(bytes: number | null) {
  if (!bytes) return null;
  const gb = bytes / 1_073_741_824;
  return gb >= 1 ? `${gb.toFixed(1)} GB` : `${(bytes / 1_048_576).toFixed(0)} MB`;
}

export function ModelCard({
  model,
  selected,
  onSelect,
}: {
  model: AiModel;
  selected?: boolean;
  onSelect?: () => void;
}) {
  const offline = model.healthStatus !== "connected";
  const tags = [
    model.local ? "LOCAL" : "CLOUD",
    model.openWeight ? "OPEN" : model.weightClass === "experimental" ? "EXPERIMENTAL" : "CLOSED",
    model.capabilities.reasoning ? "REASONING" : null,
    model.capabilities.vision ? "VISION" : null,
    model.capabilities.coding ? "CODING" : null,
    model.contextWindow ? `${Math.round(model.contextWindow / 1000)}K CONTEXT` : null,
    model.costType === "no_api_credits" ? "NO API CREDITS" : "API METERED",
  ].filter(Boolean);

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={offline && model.weightClass !== "experimental"}
      className={`ai-model-card ${selected ? "is-selected" : ""} ${offline ? "is-offline" : ""}`}
    >
      <div className="ai-model-card__header">
        <h3 className="ai-model-card__title">{model.name}</h3>
        <span className={`ai-model-card__status ${offline ? "is-offline" : "is-online"}`}>
          {offline ? "OFFLINE" : model.local ? "LOCAL • NO API CREDITS" : "CONNECTED"}
        </span>
      </div>
      {model.description && <p className="ai-model-card__desc">{model.description}</p>}
      <div className="ai-model-card__tags">
        {tags.map((tag) => (
          <span key={tag} className="ai-model-card__tag">{tag}</span>
        ))}
      </div>
      <p className="ai-model-card__meta">
        {model.license ? `License: ${model.license}` : "Review license before commercial use"}
        {formatSize(model.sizeBytes) ? ` · ${formatSize(model.sizeBytes)}` : ""}
        {model.loaded === true ? " · Loaded" : model.loaded === false ? " · Not installed" : ""}
      </p>
    </button>
  );
}
