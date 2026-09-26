import "server-only";

import { planAgentTools, TOOL_SOURCE_LABELS, type PlannedToolCall } from "./planner";
export type { PlannedToolCall } from "./planner";
import { invokeAgentTool, type AgentToolContext, type AgentToolName } from "./tools";

export type ToolRunResult = {
  name: AgentToolName;
  label: string;
  args: Record<string, unknown>;
  result: unknown;
  sources: string[];
  error?: string;
};

function summarizeToolResult(name: AgentToolName, result: unknown): string {
  if (!result || typeof result !== "object") return String(result ?? "No data");
  const r = result as Record<string, unknown>;

  if (name === "searchMovies" || name === "searchByVibe" || name === "searchSemanticCatalog") {
    const results = (r.results as Array<{ id: number; title: string; year?: number | null }>) ?? [];
    if (!results.length) return "No catalog matches.";
    return results
      .slice(0, 8)
      .map((m) => `- ${m.title}${m.year ? ` (${m.year})` : ""} [id ${m.id}]`)
      .join("\n");
  }

  if (name === "recommendMovies" || name === "buildMarathon" || name === "buildDoubleFeature") {
    const data = (r.data as Record<string, unknown>) ?? r;
    const primary = data.primary as { id: number; title: string; year?: number | null } | undefined;
    const movies = (data.movies as Array<{ id: number; title: string }>) ?? [];
    const lines = primary ? [`Primary: ${primary.title} [id ${primary.id}]`] : [];
    for (const m of movies.slice(0, 6)) lines.push(`- ${m.title} [id ${m.id}]`);
    return lines.join("\n") || "No recommendations available.";
  }

  if (name === "getMovie") {
    const movie = r as { title?: string; year?: number; runtime?: number; genres?: Array<{ name: string }> };
    return [
      movie.title,
      movie.year ? `(${movie.year})` : null,
      movie.runtime ? `${movie.runtime} min` : null,
      movie.genres?.map((g) => g.name).join(", "),
    ]
      .filter(Boolean)
      .join(" · ");
  }

  if (name === "getTasteDNA") {
    const genres = (r as { genres?: Array<{ name: string; count: number }> }).genres ?? [];
    return genres.slice(0, 6).map((g) => `${g.name} (${g.count})`).join(", ") || "Insufficient taste data.";
  }

  if (Array.isArray(r.watchlist) || Array.isArray(r.history) || Array.isArray(r.favorites)) {
    const ids = (r.watchlist ?? r.history ?? r.favorites) as number[];
    return ids.length ? `Movie IDs: ${ids.slice(0, 20).join(", ")}` : "Empty.";
  }

  try {
    return JSON.stringify(result).slice(0, 2000);
  } catch {
    return "Tool result unavailable.";
  }
}

export async function runAgentTools(
  message: string,
  ctx: AgentToolContext,
  onProgress?: (event: { type: "tool_start" | "tool_end"; name: AgentToolName; label: string }) => void,
  plannedOverride?: PlannedToolCall[],
): Promise<{ results: ToolRunResult[]; promptBlock: string; sources: string[] }> {
  const planned = plannedOverride ?? planAgentTools(message, ctx.resolvedEntities);
  const results: ToolRunResult[] = [];
  const sources = new Set<string>();

  for (const call of planned) {
    onProgress?.({ type: "tool_start", name: call.name, label: call.label });
    try {
      const result = await invokeAgentTool(call.name, call.args, ctx);
      for (const s of TOOL_SOURCE_LABELS[call.name]) sources.add(s);
      results.push({
        name: call.name,
        label: call.label,
        args: call.args,
        result,
        sources: TOOL_SOURCE_LABELS[call.name],
      });
    } catch (error) {
      results.push({
        name: call.name,
        label: call.label,
        args: call.args,
        result: null,
        sources: TOOL_SOURCE_LABELS[call.name],
        error: error instanceof Error ? error.message : "Tool failed",
      });
    }
    onProgress?.({ type: "tool_end", name: call.name, label: call.label });
  }

  const promptBlock = results
    .map((r) => {
      const summary = r.error ? `Error: ${r.error}` : summarizeToolResult(r.name, r.result);
      return `### Tool: ${r.name}\n${summary}`;
    })
    .join("\n\n");

  return { results, promptBlock, sources: [...sources] };
}
