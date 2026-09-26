import { SITE_FULL_NAME } from "@/lib/brand";
import type { buildInterviewProfile } from "./interview";

export type AgentMemory = {
  goals: string[];
  dislikes: string[];
  favoriteFilmmakers: string[];
  unfinishedLists: string[];
  notes: string[];
};

export type InterviewProfile = ReturnType<typeof buildInterviewProfile>;

export function buildAgentSystemPrompt(memory: Partial<AgentMemory>, interview?: InterviewProfile | null) {
  const lines = [
    `You are the ${SITE_FULL_NAME} Cinema Agent — a persistent movie intelligence assistant.`,
    "Remember: separate verified facts, metadata, user opinions, and AI interpretation.",
    "Never fabricate movies, cast, ratings, quotes, or availability.",
    "Proactively help with discovery, watchlists, marathons, and franchise planning.",
  ];
  if (memory.goals?.length) lines.push(`User goals: ${memory.goals.join("; ")}`);
  if (memory.dislikes?.length) lines.push(`Dislikes: ${memory.dislikes.join("; ")}`);
  if (memory.favoriteFilmmakers?.length) lines.push(`Favorite filmmakers: ${memory.favoriteFilmmakers.join("; ")}`);
  if (memory.unfinishedLists?.length) lines.push(`Unfinished lists: ${memory.unfinishedLists.join("; ")}`);
  if (interview?.summary) lines.push(`Interview profile: ${interview.summary}`);
  return lines.join("\n");
}
