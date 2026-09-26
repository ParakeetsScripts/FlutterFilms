import type { AgentToolName } from "./tools";

export type PlannedToolCall = {
  name: AgentToolName;
  args: Record<string, unknown>;
  label: string;
};

export function planAgentTools(message: string): PlannedToolCall[] {
  const text = message.trim();
  const lower = text.toLowerCase();
  const planned: PlannedToolCall[] = [];
  const idMatch = text.match(/\btmdb\s*(?:id\s*)?(\d{3,})\b/i) ?? text.match(/\bmovie\s*#?(\d{3,})\b/i);

  if (/marathon|weekend\b/.test(lower)) {
    planned.push({ name: "buildMarathon", args: {}, label: "Building weekend marathon…" });
  } else if (/double feature|two movies|pair\b/.test(lower)) {
    planned.push({ name: "buildDoubleFeature", args: {}, label: "Finding double feature…" });
  } else if (/newsletter|weekly brief|digest\b/.test(lower)) {
    planned.push({ name: "createNewsletter", args: {}, label: "Loading catalog updates…" });
  } else if (/movie night|invite|invitation\b/.test(lower)) {
    planned.push({ name: "createMovieNight", args: { title: "Movie Night" }, label: "Preparing movie night card…" });
  } else   if (/poster|artwork|concept card\b/.test(lower)) {
    planned.push({ name: "generateImage", args: { title: text.slice(0, 80) }, label: "Building poster concept card…" });
  }

  if (/recommend|suggest|pick|tonight|what should i watch|give me\b/.test(lower)) {
    const mode = /different|new|outside/.test(lower) ? "anti_algorithm" : "instant";
    planned.push({ name: "recommendMovies", args: { mode }, label: "Using your taste profile…" });
  }

  if (/vibe|mood|feel|atmosphere|vibes\b/.test(lower)) {
    planned.push({ name: "searchByVibe", args: { query: text }, label: "Searching catalog by vibe…" });
  }

  if (/remember|scene|trapped|chased|hallway|snow|building|vague\b/.test(lower)) {
    planned.push({
      name: "searchSemanticCatalog",
      args: { query: text, kind: "scene" },
      label: "Smart catalog search (scene cues)…",
    });
  }

  const personMatch = text.match(/\bperson\s*#?(\d{3,})\b/i) ?? text.match(/\bactor\s*#?(\d{3,})\b/i);
  if (personMatch) {
    planned.push({ name: "getPerson", args: { personId: Number(personMatch[1]) }, label: "Loading person filmography…" });
  }

  const collectionMatch = text.match(/\b(collection|franchise)\s*#?(\d{3,})\b/i);
  if (collectionMatch) {
    planned.push({
      name: "getFranchise",
      args: { collectionId: Number(collectionMatch[2]) },
      label: "Loading franchise collection…",
    });
  }

  if (/add to watchlist|save to watchlist|put on watchlist\b/.test(lower)) {
    const movieId = idMatch ? Number(idMatch[1]) : undefined;
    if (movieId) {
      planned.push({ name: "createWatchlistEntry", args: { movieId }, label: "Adding to watchlist…" });
    }
  }
  if (/remove from watchlist|delete from watchlist\b/.test(lower) && idMatch) {
    planned.push({ name: "removeWatchlistEntry", args: { movieId: Number(idMatch[1]) }, label: "Removing from watchlist…" });
  }
  if (/more like this|less like this|not interested\b/.test(lower) && idMatch) {
    const feedback = /less like|not interested/.test(lower) ? "less_like_this" : "more_like_this";
    planned.push({
      name: "createRecommendationFeedback",
      args: { movieId: Number(idMatch[1]), feedback },
      label: "Recording recommendation feedback…",
    });
  }
  if (/room code|movie room\b/.test(lower)) {
    const codeMatch = text.match(/\b([a-f0-9]{8})\b/i);
    if (codeMatch) {
      planned.push({ name: "getCommunityRoom", args: { code: codeMatch[1] }, label: "Loading room state…" });
    }
  }

  if (/search|find|look for|show me\b/.test(lower) && !planned.some((p) => p.name === "searchByVibe")) {
    planned.push({ name: "searchMovies", args: { query: text }, label: "Searching movie database…" });
  }

  if (idMatch) {
    planned.push({ name: "getMovie", args: { movieId: Number(idMatch[1]) }, label: "Loading movie details…" });
  }

  if (/watchlist\b/.test(lower)) {
    planned.push({ name: "getWatchlist", args: {}, label: "Loading watchlist…" });
  }
  if (/history|watched|recently\b/.test(lower)) {
    planned.push({ name: "getWatchHistory", args: {}, label: "Loading watch history…" });
  }
  if (/favorite|favourites\b/.test(lower)) {
    planned.push({ name: "getFavorites", args: {}, label: "Loading favorites…" });
  }
  if (/taste|dna|preference|profile\b/.test(lower)) {
    planned.push({ name: "getTasteDNA", args: {}, label: "Loading taste DNA…" });
  }

  if (/where (can i|to) watch|streaming|providers\b/.test(lower) && idMatch) {
    planned.push({ name: "findWhereToWatch", args: { movieId: Number(idMatch[1]) }, label: "Checking watch providers…" });
  }

  if (!planned.length) {
    planned.push({ name: "searchMovies", args: { query: text }, label: "Searching movie database…" });
  }

  const seen = new Set<string>();
  return planned.filter((p) => {
    const key = `${p.name}:${JSON.stringify(p.args)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 5);
}

export const TOOL_SOURCE_LABELS: Record<AgentToolName, string[]> = {
  searchMovies: ["Verified catalog", "TMDB metadata"],
  getMovie: ["TMDB movie details"],
  getPerson: ["TMDB person credits"],
  getCollection: ["TMDB collection"],
  recommendMovies: ["Your library", "TMDB recommendations"],
  searchByVibe: ["Catalog metadata", "AI interpretation"],
  getTasteDNA: ["Your watch history", "Favorites"],
  getWatchHistory: ["Your data"],
  getWatchlist: ["Your data"],
  getFavorites: ["Your data"],
  createWatchlistEntry: ["Your account"],
  removeWatchlistEntry: ["Your account"],
  createRecommendationFeedback: ["Your account"],
  buildMarathon: ["Your taste", "TMDB catalog"],
  buildDoubleFeature: ["Your taste", "TMDB catalog"],
  findWhereToWatch: ["TMDB watch providers"],
  getFranchise: ["TMDB collection"],
  getFeature: ["Feature registry"],
  searchSemanticCatalog: ["Smart catalog search", "TMDB metadata"],
  generateImage: ["Poster concept builder"],
  generateVideo: ["Video provider"],
  createMovieNight: ["Your lists", "AI graphic"],
  createNewsletter: ["TMDB trending", "Catalog updates"],
  getCommunityRoom: ["Shared room data"],
};
