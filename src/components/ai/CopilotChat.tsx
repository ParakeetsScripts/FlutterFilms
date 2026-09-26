"use client";

import { ModelSelector } from "@/components/ai/ModelSelector";
import { useUserLibrary } from "@/components/providers/UserLibraryProvider";
import { userStore } from "@/lib/user/store";
import type { AiModel } from "@/lib/ai/types";
import { useEffect, useRef, useState } from "react";

const STARTERS = [
  "Find something like Interstellar but less serious.",
  "Give me three movies for tonight.",
  "Show me hidden Indian thrillers from the last 10 years.",
  "Build a five-movie weekend marathon.",
];

export function CopilotChat() {
  const { settings, updateSettings, watchlist, favorites, history } = useUserLibrary();
  const [models, setModels] = useState<AiModel[]>([]);
  const [ollamaConnected, setOllamaConnected] = useState(false);
  const [modelId, setModelId] = useState("auto");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string; sources?: string[] }>>([]);
  const [loading, setLoading] = useState(false);
  const [routeReason, setRouteReason] = useState<string | null>(null);
  const [toolStatus, setToolStatus] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/ai/models")
      .then((r) => r.json())
      .then((data) => {
        setModels(data.models ?? []);
        const connectedCount = (data.models ?? []).filter((m: AiModel) => m.healthStatus === "connected").length;
        setOllamaConnected(
          connectedCount > 0 ||
            (Boolean(data.ollamaConfigured) &&
              data.providers?.find((p: { id: string }) => p.id === "ollama")?.healthStatus === "connected"),
        );
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send(text: string) {
    if (!text.trim() || loading) return;
    const userMsg = { role: "user" as const, content: text.trim() };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setLoading(true);
    setRouteReason(null);
    setToolStatus("Using movie database…");
    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: next,
          modelId,
          privateMode: settings.privateMode,
          spoilerLevel: settings.spoilerLevel,
          agentMemory: settings.agentMode ? userStore.agentMemory() : undefined,
          interviewProfile: userStore.interviewProfile(),
          useAgentTools: true,
          watchlist,
          favorites,
          history,
        }),
      });
      if (!response.ok) {
        const err = (await response.json()) as { error?: string };
        throw new Error(err.error ?? "AI unavailable");
      }
      setRouteReason(response.headers.get("X-Route-Reason"));
      setToolStatus(null);
      const sourcesHeader = response.headers.get("X-Sources");
      const sources = sourcesHeader ? (JSON.parse(sourcesHeader) as string[]) : [];
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistant = "";
      setMessages((m) => [...m, { role: "assistant", content: "", sources }]);
      if (reader) {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          assistant += decoder.decode(value, { stream: true });
          setMessages((m) => {
            const copy = [...m];
            copy[copy.length - 1] = { role: "assistant", content: assistant, sources };
            return copy;
          });
        }
      }
    } catch (error) {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: error instanceof Error ? error.message : "AI request failed." },
      ]);
    } finally {
      setLoading(false);
      setToolStatus(null);
    }
  }

  return (
    <div className="copilot">
      <header className="copilot__header">
        <div>
          <p className="eyebrow">Cinema Agent Mode</p>
          <h1 className="copilot__title">AI Copilot</h1>
          <p className="copilot__subtitle">Persistent movie agent — discovery, marathons, comparisons, and spoiler-safe briefings.</p>
        </div>
        <ModelSelector models={models} value={modelId} onChange={setModelId} ollamaConnected={ollamaConnected} />
      </header>

      <label className="copilot__private">
        <input
          type="checkbox"
          checked={settings.privateMode}
          onChange={(e) => updateSettings({ privateMode: e.target.checked })}
        />
        <span>
          <strong>Private Mode</strong> — route eligible conversations through self-hosted models only.
          <em className="block text-xs text-[var(--text-muted)] mt-1">
            Privacy depends on your server configuration. No per-message API credits for local models.
          </em>
        </span>
      </label>

      {routeReason && <p className="copilot__route">Routed: {routeReason}</p>}
      {toolStatus && <p className="copilot__route" role="status">{toolStatus}</p>}

      <div className="copilot__messages">
        {messages.length === 0 && (
          <div className="copilot__starters">
            {STARTERS.map((starter) => (
              <button key={starter} type="button" className="filter-chip" onClick={() => send(starter)}>
                {starter}
              </button>
            ))}
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`copilot__bubble copilot__bubble--${msg.role}`}>
            {msg.role === "assistant" && <span className="copilot__label">AI-generated</span>}
            <p>{msg.content}</p>
            {msg.sources?.length ? (
              <p className="mt-2 text-xs text-[var(--text-muted)]">
                Sources used: {msg.sources.join(" · ")}
              </p>
            ) : null}
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <form
        className="copilot__composer"
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about any movie, actor, franchise, or mood…"
          className="copilot__input"
        />
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Thinking…" : "Send"}
        </button>
      </form>
    </div>
  );
}
