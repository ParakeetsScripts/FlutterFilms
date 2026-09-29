"use client";

import { readApiError } from "@/lib/errors/public-message";
import { useState } from "react";

export function FeedbackDialog() {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState("general");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  async function submit() {
    setStatus(null);
    if (message.trim().length < 10) {
      setStatus("Please enter at least 10 characters.");
      return;
    }
    const response = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category, message }),
    });
    const data = await response.json();
    if (!response.ok) {
      setStatus(readApiError(data, "save") ?? "Failed to send feedback.");
      return;
    }
    const savedId = typeof data.id === "string" ? data.id : null;
    setStatus(savedId ? `Thank you — feedback saved (${savedId.slice(0, 8)}…).` : "Thank you — feedback saved.");
    setMessage("");
    setCategory("general");
    setTimeout(() => setOpen(false), 2000);
  }

  if (!open) {
    return (
      <button type="button" className="btn btn-secondary feedback-trigger" onClick={() => setOpen(true)}>
        Send feedback
      </button>
    );
  }

  return (
    <div className="ai-usage-card space-y-3">
      <p className="font-medium">Send feedback</p>
      <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2">
        <option value="bug">Bug</option>
        <option value="feature">Feature request</option>
        <option value="recommendation">Recommendation quality</option>
        <option value="general">General</option>
      </select>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={4}
        className="w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2"
        placeholder="Tell us what worked or what didn't… (min. 10 characters)"
      />
      <p className="text-xs text-[var(--text-secondary)]">Stored securely — used to improve FlutterFilms.</p>
      <div className="flex gap-2">
        <button type="button" className="btn btn-primary" onClick={submit}>Submit</button>
        <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
      </div>
      {status && <p className="text-sm text-[var(--text-secondary)]">{status}</p>}
    </div>
  );
}
