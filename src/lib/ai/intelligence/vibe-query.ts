const STOPWORDS = new Set([
  "something",
  "like",
  "give",
  "me",
  "one",
  "movie",
  "movies",
  "for",
  "tonight",
  "a",
  "an",
  "the",
  "under",
  "hours",
  "hour",
  "mins",
  "minutes",
  "completely",
  "different",
  "from",
  "what",
  "i",
  "normally",
  "watch",
  "but",
  "and",
  "or",
  "that",
  "this",
  "with",
  "without",
  "more",
  "less",
  "very",
  "really",
  "feel",
  "watching",
  "want",
  "need",
  "show",
  "find",
  "get",
]);

export type VibeQueryMode =
  | "tonight_pick"
  | "reference_twist"
  | "genre_filtered"
  | "explore_outside"
  | "general";

export type ParsedVibeQuery = {
  mode: VibeQueryMode;
  referenceTitle?: string;
  /** Genres requested after "but …" (e.g. funnier → comedy). */
  twistGenres: number[];
  /** Direct genre filters (thriller, horror, etc.). */
  filterGenres: number[];
  runtimeLte?: number;
  runtimeGte?: number;
  ratingGte?: number;
  singlePick: boolean;
  resultLimit: number;
  keywords: string[];
  notes: string[];
};

export function wantsSinglePick(query: string): boolean {
  return /\b(one movie|a movie for tonight|pick one|just one|single movie|one film|one for tonight)\b/i.test(
    query.toLowerCase(),
  );
}

export function parseVibeQuery(query: string): ParsedVibeQuery {
  const q = query.trim();
  const lower = q.toLowerCase();
  const twistGenres = new Set<number>();
  const filterGenres = new Set<number>();
  const notes: string[] = [];

  const butClause = q.match(/\bbut\s+([^,.]+)/i)?.[1] ?? "";
  if (/funny|funnier|laugh|comedy|light/i.test(butClause)) {
    twistGenres.add(35);
    notes.push("Comedy twist");
  }
  if (/scarier|scary|horror/i.test(butClause)) twistGenres.add(27);
  if (/darker|grittier/i.test(butClause)) twistGenres.add(18);
  if (/shorter|faster|quicker/i.test(butClause)) notes.push("Shorter runtime");

  if (/thriller|suspense|twist/i.test(q)) {
    filterGenres.add(53);
    notes.push("Thriller");
  }
  if (/scary|horror|fear/i.test(q)) filterGenres.add(27);
  if (/action|intense|explos/i.test(q)) filterGenres.add(28);
  if (/romance|love/i.test(q)) filterGenres.add(10749);
  if (/drama|emotional|melanchol|sad|lonely|rain/i.test(q)) filterGenres.add(18);
  if (/animation|animated|pixar|anime/i.test(q)) filterGenres.add(16);
  if (/documentary|true story|real events/i.test(q)) filterGenres.add(99);
  if (/funny|funnier|laugh|comedy|light/i.test(q) && !twistGenres.has(35)) {
    filterGenres.add(35);
    if (!notes.includes("Comedy")) notes.push("Comedy");
  }
  if (/interstellar|space|sci-?fi|future|galaxy/i.test(q) && !butClause) {
    filterGenres.add(878);
    if (!notes.includes("Sci-fi")) notes.push("Sci-fi");
  }

  let referenceTitle: string | undefined;
  const likeMatch = q.match(/(?:like|similar to)\s+([^,]+?)(?:\s+but|\s+and|\s+with|$)/i);
  if (likeMatch?.[1]) {
    referenceTitle = likeMatch[1].trim();
  }

  const titleCase = q.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*/g);
  if (!referenceTitle && titleCase?.length) {
    referenceTitle = titleCase.find((title) => title.length > 3 && !STOPWORDS.has(title.toLowerCase()));
  }

  let runtimeLte: number | undefined;
  const underHours = lower.match(/under\s+(\d+)\s*(?:hours?|h)\b/);
  if (underHours) runtimeLte = Number(underHours[1]) * 60;
  const underMinutes = lower.match(/under\s+(\d+)\s*(?:minutes?|mins?|m)\b/);
  if (underMinutes) runtimeLte = Number(underMinutes[1]);
  if (/shorter|faster|quicker/i.test(butClause) && !runtimeLte) runtimeLte = 110;

  const singlePick = wantsSinglePick(q);
  const exploreOutside = /different|outside|unusual|normally|hidden gem|never seen/i.test(lower);

  let mode: VibeQueryMode = "general";
  if (singlePick) mode = "tonight_pick";
  else if (exploreOutside) mode = "explore_outside";
  else if (referenceTitle) mode = "reference_twist";
  else if (filterGenres.size || runtimeLte) mode = "genre_filtered";

  if (singlePick) notes.unshift("Tonight's pick");
  else if (mode === "reference_twist" && referenceTitle) {
    notes.unshift(`Like ${referenceTitle}`);
  } else if (exploreOutside) notes.push("Outside your usual lane");

  const keywords = extractKeywords(q, referenceTitle);

  return {
    mode,
    referenceTitle,
    twistGenres: [...twistGenres],
    filterGenres: [...filterGenres],
    runtimeLte,
    ratingGte: exploreOutside ? 7 : /beautiful|cinematograph|visual|atmospher/i.test(q) ? 7 : undefined,
    singlePick,
    resultLimit: singlePick ? 1 : 6,
    keywords,
    notes: [...new Set(notes)],
  };
}

function extractKeywords(query: string, referenceTitle?: string): string[] {
  const keywords: string[] = [];
  if (referenceTitle) keywords.push(referenceTitle);

  const titleCase = query.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*/g) ?? [];
  for (const title of titleCase) {
    if (title.length > 3 && !keywords.includes(title)) keywords.push(title);
  }

  const words = query
    .replace(/[^\w\s'-]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !STOPWORDS.has(word.toLowerCase()));

  keywords.push(...words.slice(0, 4));
  return [...new Set(keywords)].slice(0, 5);
}
