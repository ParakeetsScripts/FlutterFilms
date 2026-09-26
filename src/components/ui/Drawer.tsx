"use client";

import { useEffect } from "react";

export function Drawer({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="drawer-root" role="dialog" aria-label={title}>
      <button type="button" className="drawer-backdrop" onClick={onClose} aria-label="Close" />
      <div className="drawer-panel">
        <header className="drawer-panel__header">
          <h2 className="drawer-panel__title">{title}</h2>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Close</button>
        </header>
        <div className="drawer-panel__body">{children}</div>
      </div>
    </div>
  );
}
