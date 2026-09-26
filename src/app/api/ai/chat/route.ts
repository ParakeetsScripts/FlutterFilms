import { rateLimit, clientKey } from "@/lib/api";
import { runAgentTools } from "@/lib/ai/agent/run";
import { runCopilotChat } from "@/lib/ai/chat";
import type { ChatMessage } from "@/lib/ai/types";
import { getSessionUser } from "@/lib/auth/session";
import { getUserLibrary } from "@/lib/user/library-repository";
import { NextResponse } from "next/server";

function streamOllama(body: ReadableStream<Uint8Array>, onToken: (chunk: string) => void) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  return new ReadableStream({
    async pull(controller) {
      const { value, done } = await reader.read();
      if (done) {
        controller.close();
        return;
      }
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const json = JSON.parse(line) as { message?: { content?: string }; done?: boolean };
          if (json.message?.content) {
            onToken(json.message.content);
            controller.enqueue(new TextEncoder().encode(json.message.content));
          }
          if (json.done) controller.close();
        } catch {
          /* ignore partial */
        }
      }
    },
  });
}

function streamOpenAi(body: ReadableStream<Uint8Array>, onToken: (chunk: string) => void) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  return new ReadableStream({
    async pull(controller) {
      const { value, done } = await reader.read();
      if (done) {
        controller.close();
        return;
      }
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        const trimmed = line.replace(/^data:\s*/, "").trim();
        if (!trimmed || trimmed === "[DONE]") continue;
        try {
          const json = JSON.parse(trimmed) as { choices?: Array<{ delta?: { content?: string } }> };
          const delta = json.choices?.[0]?.delta?.content;
          if (delta) {
            onToken(delta);
            controller.enqueue(new TextEncoder().encode(delta));
          }
        } catch {
          /* ignore */
        }
      }
    },
  });
}

export async function POST(request: Request) {
  try {
    rateLimit(`ai-chat:${clientKey(request)}`, 20);
    const body = (await request.json()) as {
      messages?: ChatMessage[];
      modelId?: string;
      privateMode?: boolean;
      spoilerLevel?: "none" | "light" | "moderate" | "full";
      agentMemory?: Record<string, string[]>;
      interviewProfile?: import("@/lib/ai/intelligence/agent").InterviewProfile;
      useAgentTools?: boolean;
      watchlist?: number[];
      favorites?: number[];
      history?: number[];
      streamFormat?: "text" | "ndjson";
    };
    const messages = body.messages ?? [];
    if (!messages.length) {
      return NextResponse.json({ error: "Messages required." }, { status: 400 });
    }

    const session = await getSessionUser();
    let watchlist = body.watchlist ?? [];
    let favorites = body.favorites ?? [];
    let history = body.history ?? [];

    if (session) {
      const library = await getUserLibrary(session.id);
      if (!body.watchlist?.length) watchlist = library.watchlist;
      if (!body.favorites?.length) favorites = library.favorites;
      if (!body.history?.length) history = library.history.map((h) => h.movieId);
    }

    const lastUser = messages.filter((m) => m.role === "user").at(-1)?.content ?? "";
    const useTools = body.useAgentTools !== false;
    let toolResults = "";
    let sources: string[] = [];
    const toolEvents: Array<{ type: string; name?: string; label?: string }> = [];

    if (useTools && lastUser.trim()) {
      const agentRun = await runAgentTools(
        lastUser,
        { userId: session?.id, watchlist, favorites, history },
        (event) => toolEvents.push(event),
      );
      toolResults = agentRun.promptBlock;
      sources = agentRun.sources;
    }

    const { upstream, model, routeReason } = await runCopilotChat({
      messages,
      modelId: body.modelId,
      privateMode: body.privateMode,
      spoilerLevel: body.spoilerLevel,
      agentMemory: body.agentMemory,
      interviewProfile: body.interviewProfile,
      toolResults,
      sources,
      favorites,
      history,
      watchlist,
      userId: session?.id,
    });

    if (!upstream.body) {
      return NextResponse.json({ error: "No stream from model." }, { status: 502 });
    }

    const ndjson = body.streamFormat === "ndjson";

    if (ndjson) {
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          for (const event of toolEvents) {
            controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
          }
          if (sources.length) {
            controller.enqueue(encoder.encode(`${JSON.stringify({ type: "sources", sources })}\n`));
          }
          const tokenStream =
            model.providerId === "ollama"
              ? streamOllama(upstream.body!, (chunk) => {
                  controller.enqueue(encoder.encode(`${JSON.stringify({ type: "token", content: chunk })}\n`));
                })
              : streamOpenAi(upstream.body!, (chunk) => {
                  controller.enqueue(encoder.encode(`${JSON.stringify({ type: "token", content: chunk })}\n`));
                });
          const reader = tokenStream.getReader();
          while (true) {
            const { done } = await reader.read();
            if (done) break;
          }
          controller.enqueue(encoder.encode(`${JSON.stringify({ type: "done", sources, modelId: model.id })}\n`));
          controller.close();
        },
      });
      return new Response(stream, {
        headers: {
          "Content-Type": "application/x-ndjson; charset=utf-8",
          "X-Model-Id": model.id,
          "X-Route-Reason": routeReason,
        },
      });
    }

    const stream =
      model.providerId === "ollama"
        ? streamOllama(upstream.body, () => {})
        : streamOpenAi(upstream.body, () => {});

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Model-Id": model.id,
        "X-Model-Name": model.name,
        "X-Route-Reason": routeReason,
        "X-Cost-Type": model.costType,
        "X-Sources": JSON.stringify(sources),
        "X-Tools-Used": JSON.stringify(toolEvents.filter((e) => e.type === "tool_start").map((e) => e.name)),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI request failed.";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
