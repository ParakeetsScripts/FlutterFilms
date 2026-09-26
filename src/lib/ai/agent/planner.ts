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

  if (/marathon|weekend\b/.test(lower)) {
    planned.push({ name: "buildMarathon", args: {}, label: "Building weekend marathon…" });
  } else if (/double feature|two movies|pair\b/.test(lower)) {
    planned.push({ name: "buildDoubleFeature", args: {}, label: "Finding double feature…" });
  } else if (/newsletter|weekly brief|digest\b/.test(lower)) {
    planned.push({ name: "createNewsletter", args: {}, label: "Loading catalog updates…" });
  } else if (/movie night|invite|invitation\b/.test(lower)) {
    planned.push({ name: "createMovieNight", args: { title: "Movie Night" }, label: "Preparing movie night card…" });
  } else if (/poster|artwork|image\b/.test(lower)) {
    planned.push({ name: "generateImage", args: { title: text.slice(0, 80) }, label: "Generating AI artwork…" });
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
      label: "Searching scene memory…",
    });
  }

  if (/search|find|look for|show me\b/.test(lower) && !planned.some((p) => p.name === "searchByVibe")) {
    planned.push({ name: "searchMovies", args: { query: text }, label: "Searching movie database…" });
  }

  const idMatch = text.match(/\btmdb\s*(?:id\s*)?(\d{3,})\b/i) ?? text.match(/\bmovie\s*#?(\d{3,})\b/i);
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
  searchSemanticCatalog: ["Catalog search", "AI interpretation"],
  generateImage: ["AI-generated artwork"],
  generateVideo: ["Video provider"],
  createMovieNight: ["Your lists", "AI graphic"],
  createNewsletter: ["TMDB trending", "Catalog updates"],
  getCommunityRoom: ["Shared room data"],
};
