"use client";

import { THEMES, type AppTheme } from "@/lib/themes";
import { useUserLibrary } from "@/components/providers/UserLibraryProvider";
import { useState } from "react";

export function ThemeToggle() {
  const { settings, updateSettings } = useUserLibrary();
  const [open, setOpen] = useState(false);
  const current = THEMES.find((theme) => theme.id === settings.theme) ?? THEMES[0];

  function select(theme: AppTheme) {
    updateSettings({ theme });
    setOpen(false);
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="theme-toggle-btn"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={`Theme: ${current.label}`}
      >
        <span className="theme-toggle-btn__dot" />
        {current.label}
      </button>
      {open && (
        <>
          <button type="button" className="theme-toggle-backdrop" onClick={() => setOpen(false)} aria-label="Close themes" />
          <ul className="theme-menu" role="listbox">
            {THEMES.map((theme) => (
              <li key={theme.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={settings.theme === theme.id}
                  className={`theme-menu__item ${settings.theme === theme.id ? "is-active" : ""}`}
                  onClick={() => select(theme.id)}
                >
                  <span className={`theme-swatch theme-swatch--${theme.id}`} />
                  <span>
                    <span className="theme-menu__label">{theme.label}</span>
                    <span className="theme-menu__desc">{theme.description}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
