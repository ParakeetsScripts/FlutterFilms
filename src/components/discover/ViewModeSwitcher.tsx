"use client";

import { CATALOG_VIEW_MODES, type CatalogViewMode } from "@/lib/discover/catalog-view";
import { useRef, type KeyboardEvent } from "react";

export function ViewModeSwitcher({ value, onChange }: { value: CatalogViewMode; onChange: (view: CatalogViewMode) => void }) {
  const groupRef = useRef<HTMLDivElement>(null);

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const index = CATALOG_VIEW_MODES.findIndex((mode) => mode.id === value);
    const last = CATALOG_VIEW_MODES.length - 1;
    let next = index;
    if (event.key === "Home") next = 0;
    else if (event.key === "End") next = last;
    else if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = index <= 0 ? last : index - 1;
    else next = index >= last ? 0 : index + 1;
    onChange(CATALOG_VIEW_MODES[next].id);
    groupRef.current?.querySelectorAll<HTMLButtonElement>("[role=radio]")[next]?.focus();
  }

  return (
    <div ref={groupRef} className="view-switcher" role="radiogroup" aria-label="Catalog view" onKeyDown={onKeyDown}>
      {CATALOG_VIEW_MODES.map((mode) => {
        const checked = mode.id === value;
        return (
          <button
            key={mode.id}
            type="button"
            role="radio"
            aria-checked={checked}
            tabIndex={checked ? 0 : -1}
            title={mode.hint}
            className={`view-switcher__option ${checked ? "is-active" : ""}`}
            onClick={() => onChange(mode.id)}
          >
            {mode.label}
          </button>
        );
      })}
    </div>
  );
}
