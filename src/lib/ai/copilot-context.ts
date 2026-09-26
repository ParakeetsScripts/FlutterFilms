import "server-only";

import { SITE_FULL_NAME, SITE_NAME } from "@/lib/brand";
import { buildEvidencePacket } from "./evidence";

import type { SpoilerLevel } from "./intelligence/briefing";
import { buildAgentSystemPrompt, type AgentMemory, type InterviewProfile } from "./intelligence/agent";

const SYSTEM_BASE = `You are ${SITE_FULL_NAME} AI Copilot — a premium movie intelligence assistant.

RULES:
- Use supplied VERIFIED MOVIE DATA as authoritative for factual claims (runtime, release date, ratings, cast, crew).
- Distinguish verified catalog facts from AI interpretation. Label speculation clearly.
- Never fabricate ratings, cast, release dates, awards, or availability.
- TMDB and IMDb ratings are separate sources — never average them.
- Never claim the user watched or liked a title unless USER TASTE SIGNALS support it.
- ${SITE_NAME} is a discovery platform; it does not host copyrighted films.
- For "where to watch", direct users to provider availability, not piracy.
- When evidence is missing, say it is unavailable — do not guess.
- Be concise, cinematic, and helpful.`;

export async function buildCopilotSystemPrompt(
  userQuery: string,
  options: {
    spoilerLevel?: SpoilerLevel;
    agentMemory?: Partial<AgentMemory>;
    interviewProfile?: InterviewProfile | null;
    toolResults?: string;
    sources?: string[];
    favorites?: number[];
    history?: number[];
    watchlist?: number[];
    movieIds?: number[];
    userId?: string | null;
  } = {},
): Promise<string> {
  const query = userQuery.trim();
  if (query.length < 3) return SYSTEM_BASE;

  let catalogBlock = "";
  let evidenceSources: string[] = options.sources ?? [];
  try {
    const packet = await buildEvidencePacket({
      query,
      userId: options.userId,
      movieIds: options.movieIds,
      favorites: options.favorites,
      history: options.history,
      watchlist: options.watchlist,
    });
    if (packet.textBlock) catalogBlock = `\n\n${packet.textBlock}`;
    evidenceSources = [...new Set([...evidenceSources, ...packet.sourcesUsed])];
  } catch {
    /* evidence optional */
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
  const sourceNote = evidenceSources.length
    ? `\n\nSources used this turn: ${evidenceSources.join(" · ")}\nVerified data: TMDB · IMDb (when present) · AI interpretation: Cinema Agent`
    : "";

  return `${SYSTEM_BASE}${catalogBlock}${spoiler}${agent}${tools}${sourceNote}`;
}
