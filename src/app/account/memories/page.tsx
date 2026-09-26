"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { useEffect, useState } from "react";

type Memory = { id: string; category: string; content: string; source: string };

export default function MemoriesPage() {
  const { user, ready } = useAuth();
  const [memories, setMemories] = useState<Memory[]>([]);

  useEffect(() => {
    if (!user) return;
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => setMemories(data.memories ?? []));
  }, [user]);

  if (!ready) return null;
  if (!user) return <p className="page-container page-section">Sign in to manage agent memories.</p>;

  return (
    <div className="page-container page-section max-w-2xl">
      <header className="page-header">
        <p className="eyebrow">Cinema Agent</p>
        <h1 className="page-header__title">Your memories</h1>
        <p className="page-header__subtitle">Inspect and control what the agent remembers. Nothing is hidden.</p>
      </header>
      <ul className="space-y-3">
        {memories.map((m) => (
          <li key={m.id} className="ai-usage-card">
            <p className="text-xs uppercase text-[var(--muted)]">{m.category} · {m.source}</p>
            <p className="mt-2 text-sm">{m.content}</p>
          </li>
        ))}
        {!memories.length && <p className="text-sm text-[var(--text-muted)]">No memories stored yet.</p>}
      </ul>
    </div>
  );
}
