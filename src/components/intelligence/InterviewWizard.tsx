"use client";

import { userStore, type InterviewProfile } from "@/lib/user/store";
import { useEffect, useState } from "react";

type Question = { id: string; question: string };

export function InterviewWizard() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [profile, setProfile] = useState<InterviewProfile | null>(null);

  useEffect(() => {
    fetch("/api/ai/interview")
      .then((r) => r.json())
      .then((data) => setQuestions(data.questions ?? []));
  }, []);

  async function finish() {
    const response = await fetch("/api/ai/interview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers }),
    });
    const data = await response.json();
    userStore.setInterviewProfile(data);
    setProfile(data);
  }

  const q = questions[index];
  if (profile) {
    return (
      <div className="ai-usage-card">
        <h2 className="section-title">Your movie profile</h2>
        <p className="mt-4 text-[var(--text-secondary)]">{profile.summary}</p>
        <p className="mt-2 text-xs text-[var(--text-muted)]">Saved locally. Used by Cinema Agent Mode.</p>
      </div>
    );
  }

  if (!q) return null;

  return (
    <div className="ai-usage-card">
      <p className="eyebrow">Question {index + 1} of {questions.length}</p>
      <h2 className="section-title mt-2">{q.question}</h2>
      <textarea
        className="copilot__input mt-4 w-full min-h-[100px]"
        value={answers[q.id] ?? ""}
        onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
      />
      <div className="mt-4 flex gap-3">
        {index > 0 && <button type="button" className="btn btn-ghost" onClick={() => setIndex(index - 1)}>Back</button>}
        {index < questions.length - 1 ? (
          <button type="button" className="btn btn-secondary" onClick={() => setIndex(index + 1)}>Next</button>
        ) : (
          <button type="button" className="btn btn-primary" onClick={finish}>Build profile</button>
        )}
      </div>
    </div>
  );
}
