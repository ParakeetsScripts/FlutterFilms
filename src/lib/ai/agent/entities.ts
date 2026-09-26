import "server-only";

import { searchCatalog } from "@/lib/sync/catalog";
import { tmdbFetch } from "@/lib/tmdb/client";
import type { AgentSessionContext } from "./session-context";

export type ResolvedEntities = {
  movieId?: number;
  personId?: number;
  collectionId?: number;
  movieTitle?: string;
  personName?: string;
  collectionName?: string;
};

const PERSON_ALIASES: Record<string, string> = {
  nolan: "Christopher Nolan",
  spielberg: "Steven Spielberg",
  tarantino: "Quentin Tarantino",
  scorsese: "Martin Scorsese",
  villeneuve: "Denis Villeneuve",
};

const COLLECTION_HINTS: Array<{ pattern: RegExp; collectionId: number; name: string }> = [
  { pattern: /dark knight trilogy/i, collectionId: 263, name: "The Dark Knight Collection" },
  { pattern: /lord of the rings/i, collectionId: 119, name: "The Lord of the Rings Collection" },
  { pattern: /marvel/i, collectionId: 131296, name: "Marvel Cinematic Universe" },
];

export async function resolveEntities(
  message: string,
  session: AgentSessionContext = {},
): Promise<ResolvedEntities> {
  const text = message.trim();
  const lower = text.toLowerCase();
  const resolved: ResolvedEntities = {};

  const idMatch = text.match(/\btmdb\s*(?:id\s*)?(\d{3,})\b/i) ?? text.match(/\bmovie\s*#?(\d{3,})\b/i);
  if (idMatch) resolved.movieId = Number(idMatch[1]);

  const personIdMatch = text.match(/\bperson\s*#?(\d{3,})\b/i);
  if (personIdMatch) resolved.personId = Number(personIdMatch[1]);

  const collectionMatch = text.match(/\b(collection|franchise)\s*#?(\d{3,})\b/i);
  if (collectionMatch) resolved.collectionId = Number(collectionMatch[2]);

  if (/\b(that movie|this movie|it)\b/i.test(lower) && session.lastMovieId) {
    resolved.movieId = session.lastMovieId;
  }
  if (/\b(that director|this director|he|him)\b/i.test(lower) && session.lastPersonId) {
    resolved.personId = session.lastPersonId;
  }

  for (const hint of COLLECTION_HINTS) {
    if (hint.pattern.test(text)) {
      resolved.collectionId = hint.collectionId;
      resolved.collectionName = hint.name;
      break;
    }
  }

  if (!resolved.personId) {
    for (const [alias, fullName] of Object.entries(PERSON_ALIASES)) {
      if (lower.includes(alias) || lower.includes(fullName.toLowerCase())) {
        try {
          const search = await tmdbFetch<{ results: Array<{ id: number; name: string }> }>("/search/person", {
            query: fullName,
          });
          const top = search.results?.[0];
          if (top) {
            resolved.personId = top.id;
            resolved.personName = top.name;
          }
        } catch {
          /* optional */
        }
        break;
      }
    }
  }

  if (!resolved.movieId && !resolved.personId) {
    const quoted = text.match(/["“](.+?)["”]/);
    const query = quoted?.[1] ?? (text.length < 80 ? text : "");
    if (query.length >= 3 && !/recommend|watchlist|marathon|room/i.test(lower)) {
      try {
        const catalog = await searchCatalog(query, 1);
        const top = catalog.results[0];
        if (top) {
          resolved.movieId = top.id;
          resolved.movieTitle = top.title;
        }
      } catch {
        /* optional */
      }
    }
  }

  return resolved;
}
