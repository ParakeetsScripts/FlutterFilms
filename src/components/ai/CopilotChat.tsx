"use client";

import { ModelSelector } from "@/components/ai/ModelSelector";
import { useUserLibrary } from "@/components/providers/UserLibraryProvider";
import { userStore } from "@/lib/user/store";
import { isEndingQuestion, spoilerEscalationMessage } from "@/lib/ai/spoiler-filter";
import type { AiModel } from "@/lib/ai/types";
import type { SpoilerLevel } from "@/lib/ai/intelligence/briefing";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const STARTERS = [
  "Find something like Interstellar but less serious.",
  "Give me three movies for tonight.",
  "Show me hidden Indian thrillers from the last 10 years.",
  "Build a five-movie weekend marathon.",
];

export function CopilotChat({
  initialQuery,
  initialSpoilerLevel,
  movieId,
}: {
  initialQuery?: string | null;
  initialSpoilerLevel?: SpoilerLevel;
  movieId?: number;
}) {
  const { settings, updateSettings, watchlist, favorites, history } = useUserLibrary();
  const [models, setModels] = useState<AiModel[]>([]);
  const [ollamaConnected, setOllamaConnected] = useState(false);
  const [modelId, setModelId] = useState("auto");
  const [movieTitle, setMovieTitle] = useState<string | null>(null);
  const [input, setInput] = useState(initialQuery?.trim() ?? "");
  const [messages, setMessages] = useState<
    Array<{ role: "user" | "assistant"; content: string; sources?: string[] }>
  >([]);
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
    if (!movieId) {
      setMovieTitle(null);
      return;
    }
    fetch(`/api/ai/briefing/${movieId}?spoiler=${settings.spoilerLevel}`)
      .then((r) => r.json())
      .then((data) => setMovieTitle(data.movieTitle ?? null))
      .catch(() => setMovieTitle(null));
  }, [movieId, settings.spoilerLevel]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (initialSpoilerLevel) {
      updateSettings({ spoilerLevel: initialSpoilerLevel });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSpoilerLevel]);

  useEffect(() => {
    const prompt = initialQuery?.trim();
    if (!prompt) return;
    setInput(prompt);
    void send(prompt);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function send(text: string) {
    if (!text.trim() || loading) return;
    if (isEndingQuestion(text) && settings.spoilerLevel !== "full") {
      const userMsg = { role: "user" as const, content: text.trim() };
      setMessages((m) => [
        ...m,
        userMsg,
        {
          role: "assistant",
          content: spoilerEscalationMessage(settings.spoilerLevel),
        },
      ]);
      setInput("");
      return;
    }
    const userMsg = { role: "user" as const, content: text.trim() };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setLoading(true);
    setRouteReason(null);
    setToolStatus("Gathering verified sources…");
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
          movieIds: movieId ? [movieId] : undefined,
        }),
      });
      if (!response.ok) {
        const err = (await response.json()) as { error?: string };
        throw new Error(err.error ?? "FlutterAI is temporarily unavailable.");
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
        {
          role: "assistant",
          content: error instanceof Error ? error.message : "FlutterAI request failed.",
        },
      ]);
    } finally {
      setLoading(false);
      setToolStatus(null);
    }
  }

  return (
    <div className="copilot flutter-ai" data-testid="flutter-ai-chat">
      <header className="copilot__header">
        <div>
          <p className="eyebrow">FlutterFilms intelligence</p>
          <h1 className="copilot__title">FlutterAI</h1>
          <p className="copilot__subtitle">
            Source-grounded movie research, recommendations, and conversation — real model execution, traceable evidence.
          </p>
        </div>
        <ModelSelector models={models} value={modelId} onChange={setModelId} ollamaConnected={ollamaConnected} />
      </header>

      {movieId && movieTitle ? (
        <div className="flutter-ai__context" data-testid="flutter-ai-movie-context">
          <span className="flutter-ai__context-label">Movie context</span>
          <span className="filter-chip is-active">{movieTitle}</span>
          <Link href="/flutter-ai" className="text-xs text-[var(--text-muted)] hover:text-[var(--accent)]">
            Remove context ×
          </Link>
        </div>
      ) : null}

      <div className="mt-4">
        <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">Spoiler protection</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {(["none", "light", "moderate", "full"] as const).map((level) => (
            <button
              key={level}
              type="button"
              className={`filter-chip ${settings.spoilerLevel === level ? "is-active" : ""}`}
              onClick={() => updateSettings({ spoilerLevel: level })}
              data-testid={`flutter-ai-spoiler-${level}`}
            >
              {level}
            </button>
          ))}
        </div>
        {settings.spoilerLevel === "full" ? (
          <p className="mt-2 text-xs text-amber-400/90">⚠ Full spoilers — plot details may be discussed.</p>
        ) : (
          <p className="mt-2 text-xs text-[var(--text-muted)]">
            Your current mode prevents major plot reveals.
          </p>
        )}
      </div>

      <label className="copilot__private">
        <input
          type="checkbox"
          checked={settings.privateMode}
          onChange={(e) => updateSettings({ privateMode: e.target.checked })}
        />
        <span>
          <strong>Private Mode</strong> — route eligible conversations through self-hosted models only.
        </span>
      </label>

      {routeReason && <p className="copilot__route">Routed: {routeReason}</p>}
      {toolStatus && (
        <p className="copilot__route" role="status">{toolStatus}</p>
      )}

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
            {msg.role === "assistant" && <span className="copilot__label">FlutterAI</span>}
            <p className="whitespace-pre-wrap">{msg.content}</p>
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
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(input);
            }
          }}
          placeholder={movieTitle ? `Ask FlutterAI about ${movieTitle}…` : "Ask FlutterAI anything about movies…"}
          className="copilot__input copilot__textarea"
          rows={2}
          data-testid="flutter-ai-input"
        />
        <button type="submit" className="btn btn-primary" disabled={loading} data-testid="flutter-ai-send">
          {loading ? "Thinking…" : "Send"}
        </button>
      </form>
    </div>
  );
}
