"use client";

import { useState } from "react";

export function OverviewText({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const long = text.length > 320;

  return (
    <div>
      <p className="prose-overview">
        {long && !expanded ? `${text.slice(0, 320).trim()}…` : text}
      </p>
      {long && (
        <button type="button" className="btn-ghost mt-3 text-sm" onClick={() => setExpanded((v) => !v)}>
          {expanded ? "Show less" : "Read more"}
        </button>
      )}
    </div>
  );
}
