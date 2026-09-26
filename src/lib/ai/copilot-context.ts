import "server-only";

import { SITE_FULL_NAME, SITE_NAME } from "@/lib/brand";
import { searchCatalog } from "@/lib/sync/catalog";

import type { SpoilerLevel } from "./intelligence/briefing";
import { buildAgentSystemPrompt, type AgentMemory, type InterviewProfile } from "./intelligence/agent";

const SYSTEM_BASE = `You are ${SITE_FULL_NAME} AI Copilot — a premium movie intelligence assistant.

RULES:
- Distinguish verified catalog facts from AI suggestions. Label speculation clearly.
- Never fabricate ratings, cast, release dates, awards, or availability.
- TMDB and IMDb ratings are separate sources — never average them.
- ${SITE_NAME} is a discovery platform; it does not host copyrighted films.
- For "where to watch", direct users to provider availability, not piracy.
- Be concise, cinematic, and helpful.`;

export async function buildCopilotSystemPrompt(
  userQuery: string,
  options: {
    spoilerLevel?: SpoilerLevel;
    agentMemory?: Partial<AgentMemory>;
    interviewProfile?: InterviewProfile | null;
    toolResults?: string;
    sources?: string[];
  } = {},
): Promise<string> {
  const query = userQuery.trim();
  if (query.length < 3) return SYSTEM_BASE;

  let catalogBlock = "";
  try {
    const results = await searchCatalog(query, 1);
    const top = results.results.slice(0, 5);
    if (top.length) {
      catalogBlock = `\n\nVERIFIED CATALOG MATCHES (from local TMDB/IMDb sync):\n${top
        .map(
          (m) =>
            `- ${m.title}${m.year ? ` (${m.year})` : ""} · TMDB id ${m.id} · TMDB ${m.voteAverage ?? "n/a"}`,
        )
        .join("\n")}`;
    }
  } catch {
    /* search optional */
  }

  const spoiler = options.spoilerLevel
    ? `\n\nSPOILER SHIELD: ${options.spoilerLevel}. Do not reveal plot beyond this level.`
    : "";
  const agent =
    options.agentMemory || options.interviewProfile
      ? `\n\n${buildAgentSystemPrompt(options.agentMemory ?? {}, options.interviewProfile)}`
      : "";

  const tools = options.toolResults
    ? `\n\nTOOL RESULTS (verified data — cite these, never invent beyond them):\n${options.toolResults}`
    : "";
  const sourceNote = options.sources?.length
    ? `\n\nAvailable sources for this turn: ${options.sources.join(", ")}`
    : "";

  return `${SYSTEM_BASE}${catalogBlock}${spoiler}${agent}${tools}${sourceNote}`;
}
