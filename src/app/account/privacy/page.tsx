"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { SITE_NAME } from "@/lib/brand";
import { useUserLibrary } from "@/components/providers/UserLibraryProvider";
import Link from "next/link";
import { useState } from "react";

export default function PrivacyCenterPage() {
  const { user, logout } = useAuth();
  const { clearHistory, clearPersonalization, settings, updateSettings } = useUserLibrary();
  const [message, setMessage] = useState<string | null>(null);

  async function deleteAccount() {
    if (!user) return;
    if (!window.confirm("Permanently delete your account and library data?")) return;
    const response = await fetch("/api/auth/delete", { method: "POST" });
    if (response.ok) {
      await logout();
      setMessage("Account deleted.");
    } else {
      const data = await response.json();
      setMessage(data.error ?? "Account deletion failed.");
    }
  }

  return (
    <div className="page-container page-section max-w-2xl">
      <header className="page-header">
        <p className="eyebrow">Privacy</p>
        <h1 className="page-header__title">Privacy center</h1>
        <p className="page-header__subtitle">
          {SITE_NAME} does not sell your private watch history. You control what is stored and what is shared.
        </p>
      </header>

      {message && <p className="mb-4 text-sm text-[var(--accent-soft)]">{message}</p>}

      <div className="space-y-4">
        <section className="ai-usage-card">
          <h2 className="font-medium">Personalization</h2>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Pause learning stops new taste signals from affecting recommendations.
          </p>
          <label className="mt-4 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={settings.disablePersonalizedRows}
              onChange={(e) => updateSettings({ disablePersonalizedRows: e.target.checked })}
            />
            Pause learning
          </label>
          <button type="button" className="btn btn-ghost mt-4" onClick={clearPersonalization}>
            Reset taste &amp; preferences
          </button>
        </section>

        <section className="ai-usage-card">
          <h2 className="font-medium">Watch history</h2>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">Stored locally and synced when signed in.</p>
          <button type="button" className="btn btn-ghost mt-4" onClick={clearHistory}>
            Delete history
          </button>
        </section>

        <section className="ai-usage-card">
          <h2 className="font-medium">AI memories</h2>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Cinema Agent memories are tied to your account when signed in. Delete from Settings → AI.
          </p>
          <Link href="/settings" className="btn btn-ghost mt-4">Open settings</Link>
        </section>

        <section className="ai-usage-card">
          <h2 className="font-medium">Public profile</h2>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Only content you explicitly share (lists, rooms, Taste DNA cards) becomes public.
          </p>
          <Link href="/community" className="btn btn-ghost mt-4">Community settings</Link>
        </section>

        {user && (
          <section className="ai-usage-card border border-red-400/20">
            <h2 className="font-medium text-red-300">Delete account</h2>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Permanently removes your account and server-side library data.
            </p>
            <button type="button" className="btn btn-ghost mt-4 text-red-300" onClick={deleteAccount}>
              Delete my account
            </button>
          </section>
        )}
      </div>
    </div>
  );
}
