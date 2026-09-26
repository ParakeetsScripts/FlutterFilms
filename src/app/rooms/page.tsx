"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { track } from "@/lib/analytics/track";
import Link from "next/link";
import { useState } from "react";

export default function RoomsPage() {
  const { user } = useAuth();
  const [title, setTitle] = useState("Movie night");
  const [shareCode, setShareCode] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [spoilerLevel, setSpoilerLevel] = useState("none");

  async function createRoom() {
    const response = await fetch("/api/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create", title, spoilerLevel }),
    });
    const data = await response.json();
    if (response.ok) {
      setShareCode(data.shareCode);
      track("room_created", { code: data.shareCode });
    }
  }

  return (
    <div className="page-container page-section max-w-2xl">
      <header className="page-header">
        <p className="eyebrow">Social</p>
        <h1 className="page-header__title">Movie rooms</h1>
        <p className="page-header__subtitle">
          Create a room, share the link, vote together. Private histories stay private.
        </p>
      </header>

      {user ? (
        <section className="ai-usage-card space-y-4">
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2" placeholder="Room title" />
          <select value={spoilerLevel} onChange={(e) => setSpoilerLevel(e.target.value)} className="w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2">
            <option value="none">No spoilers</option>
            <option value="light">Light spoilers</option>
            <option value="moderate">Moderate spoilers</option>
            <option value="full">Full discussion</option>
          </select>
          <button type="button" className="btn btn-primary" onClick={createRoom}>Create room</button>
          {shareCode && (
            <div className="rounded-lg border border-[var(--border)] p-4">
              <p className="text-sm">Share this link:</p>
              <Link href={`/rooms/${shareCode}`} className="text-[var(--accent-soft)] break-all">
                /rooms/{shareCode}
              </Link>
            </div>
          )}
        </section>
      ) : (
        <p className="text-sm text-[var(--text-secondary)]">Sign in to create a room. You can still join as a guest.</p>
      )}

      <section className="ai-usage-card mt-8 space-y-4">
        <input value={joinCode} onChange={(e) => setJoinCode(e.target.value)} className="w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2" placeholder="Enter room code" />
        <Link href={joinCode ? `/rooms/${joinCode}` : "#"} className={`btn btn-secondary ${!joinCode ? "pointer-events-none opacity-50" : ""}`}>
          Join movie room
        </Link>
      </section>
    </div>
  );
}
