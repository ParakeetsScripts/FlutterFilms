import "server-only";

import { SITE_FULL_NAME, SITE_NAME } from "@/lib/brand";
import { buildEvidencePacket } from "./evidence";

import type { SpoilerLevel } from "./intelligence/briefing";
import { buildAgentSystemPrompt, type AgentMemory, type InterviewProfile } from "./intelligence/agent";

const SYSTEM_BASE = `You are FlutterAI — the movie intelligence layer of ${SITE_FULL_NAME}.

LAYER RULES:
- VERIFIED MOVIE DATA = authoritative catalog facts (runtime, release date, ratings, cast, crew).
- USER TASTE SIGNALS = personalization only when explicitly present.
- TOOL RESULTS = verified tool output — never contradict or invent beyond them.
- Your prose = interpretation or conversation — label speculation clearly.

TRUTH RULES:
- Never fabricate ratings, cast, release dates, awards, quotes, plot events, or availability.
- TMDB and IMDb ratings are separate sources — never average them.
- Never claim the user watched or liked a title unless USER TASTE SIGNALS support it.
- ${SITE_NAME} is a discovery platform; it does not host copyrighted films.
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
      spoilerLevel: options.spoilerLevel ?? "none",
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
    ? `\n\nSPOILER SHIELD (enforced — plot evidence above is already filtered):
- none: premise/themes only; no deaths, twists, endings, or major plot turns.
- light: early setup only; no endings or major twists.
- moderate: major turns allowed; avoid ending unless asked with full permission.
- full: ending and twists allowed when supported by evidence.
Current level: ${options.spoilerLevel}.`
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
