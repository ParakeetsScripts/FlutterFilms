"use client";

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
      setStatus(data.error ?? "Failed to send feedback.");
      return;
    }
    setStatus("Thank you — feedback received.");
    setMessage("");
    setTimeout(() => setOpen(false), 1500);
  }

  if (!open) {
    return (
      <button type="button" className="btn btn-ghost text-sm" onClick={() => setOpen(true)}>
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
      <p className="text-xs text-[var(--text-secondary)]">Stored securely — used to improve Flutter Films.</p>
      <div className="flex gap-2">
        <button type="button" className="btn btn-primary" onClick={submit}>Submit</button>
        <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
      </div>
      {status && <p className="text-sm text-[var(--text-secondary)]">{status}</p>}
    </div>
  );
}
