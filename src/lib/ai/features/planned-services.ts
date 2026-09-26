import "server-only";

import { getMovieEvidence } from "../evidence";
import { buildMovieBriefing } from "../intelligence/briefing";
import { analyzeFranchise, compareFranchises, findSpinOffs } from "../intelligence/franchise";
import { analyzePerson } from "../intelligence/people";
import { semanticSearch } from "../intelligence/semantic-search";
import { groupPick } from "../intelligence/social";
import { computeTasteDna } from "../intelligence/taste";
import { getMovie } from "@/lib/tmdb/movies";
import { discoverMovies } from "@/lib/tmdb/discover";
import { trustBadge } from "../trust";
import type { FeatureDefinition, FeatureRunInput, FeatureRunResult } from "./types";
import type { FeatureContext } from "./services";

const PLANNED_SLUGS = new Set([
  "director-intent",
  "production-challenges",
  "version-comparison",
  "collaboration-graph",
  "underseen-actor",
  "crew-discovery",
  "crew-influence",
  "creative-team-dna",
  "universe-map",
  "adaptation-tracker",
  "remake-evolution",
  "friend-recs",
  "spoiler-rooms",
  "sentiment-map",
  "rewatch-reflection",
  "quote-search",
]);

function ok(def: FeatureDefinition, data: unknown, labels = [trustBadge("metadata")]): FeatureRunResult {
  return { featureId: def.id, slug: def.slug, status: "success", data, labels, ranAt: new Date().toISOString() };
}

function need(def: FeatureDefinition, reason: string): FeatureRunResult {
  return {
    featureId: def.id,
    slug: def.slug,
    status: "insufficient_data",
    labels: [trustBadge("metadata")],
    error: reason,
    ranAt: new Date().toISOString(),
  };
}

export async function tryExecutePlannedFeature(
  def: FeatureDefinition,
  input: FeatureRunInput,
  ctx: FeatureContext,
): Promise<FeatureRunResult | null> {
  if (!PLANNED_SLUGS.has(def.slug)) return null;

  const favorites = ctx.favorites ?? [];
  const history = ctx.history ?? [];
  const watchlist = ctx.watchlist ?? [];
  const movieId = Number(input.movieId ?? favorites[0] ?? history[0]);
  const movieIdB = Number(input.compareMovieId ?? input.secondaryMovieId ?? watchlist[0]);
  const personId = Number(input.personId ?? 525);
  const collectionId = Number(input.collectionId ?? 9485);

  if (def.slug === "director-intent") {
    if (!movieId) return need(def, "Provide movieId.");
    const [briefing, movie] = await Promise.all([buildMovieBriefing(movieId, "light"), getMovie(movieId)]);
    const director = movie?.credits.crew.find((c) => c.job === "Director");
    return ok(
      def,
      {
        briefing,
        director: director ? { id: director.id, name: director.name } : null,
        intent: director
          ? `${director.name}'s credited direction on ${movie?.title} — interpret themes from overview and genre metadata.`
          : "Director credit unavailable in TMDB metadata for this title.",
      },
      [trustBadge("metadata"), trustBadge("ai_interpretation")],
    );
  }

  if (def.slug === "production-challenges") {
    if (!movieId) return need(def, "Provide movieId.");
    const movie = await getMovie(movieId);
    if (!movie) return need(def, "Movie not found.");
    const challenges: string[] = [];
    if (movie.runtime && movie.runtime > 150) challenges.push(`Long runtime (${movie.runtime} min) often signals ambitious production scope.`);
    if (movie.budget && movie.revenue && movie.revenue < movie.budget) {
      challenges.push("Box office below reported budget — commercial headwinds (TMDB financial metadata).");
    }
    if (!challenges.length) challenges.push("No TMDB production-finance signals — browse making-of materials for verified challenges.");
    return ok(def, { movie: { id: movie.id, title: movie.title, year: movie.year }, challenges });
  }

  if (def.slug === "version-comparison") {
    if (!movieId || !movieIdB) return need(def, "Provide movieId and compareMovieId.");
    const [a, b] = await Promise.all([getMovieEvidence(movieId), getMovieEvidence(movieIdB)]);
    if (!a || !b) return need(def, "Movies not found.");
    return ok(def, {
      a: { id: movieId, title: a.title, runtime: a.tmdb?.runtime, year: a.year },
      b: { id: movieIdB, title: b.title, runtime: b.tmdb?.runtime, year: b.year },
      note: "Compare alternate cuts, regional edits, or related releases — verify which version you are watching.",
    });
  }

  if (def.slug === "collaboration-graph") {
    const profile = await analyzePerson(personId);
    const nodes = [{ id: personId, label: profile.name, role: "center" }];
    const edges = profile.frequentCoStars.map((c) => ({
      from: personId,
      to: c.name,
      weight: c.count,
      label: `${c.count} shared top-credit titles`,
    }));
    return ok(def, { nodes, edges, profile: { name: profile.name, department: profile.department } });
  }

  if (def.slug === "underseen-actor") {
    const discovered = await discoverMovies({ sort: "rating", ratingGte: 7, page: 1 });
    const exclude = new Set([...history, ...favorites]);
    const candidates = discovered.results
      .filter((m) => !exclude.has(m.id) && (m.popularity ?? 0) < 30)
      .slice(0, 12);
    return candidates.length
      ? ok(def, { candidates, note: "Lower-popularity, well-rated catalog titles — hidden-gem discovery." }, [
          trustBadge("metadata"),
          trustBadge("ai_prediction"),
        ])
      : need(def, "No underseen candidates matched filters.");
  }

  if (def.slug === "crew-discovery") {
    const seed = movieId || favorites[0];
    if (!seed) return need(def, "Provide movieId or add favorites.");
    const movie = await getMovie(seed);
    if (!movie) return need(def, "Movie not found.");
    const departments = new Map<string, string[]>();
    for (const member of movie.credits.crew.slice(0, 40)) {
      const dept = member.department ?? "Crew";
      const list = departments.get(dept) ?? [];
      if (!list.includes(member.name)) list.push(member.name);
      departments.set(dept, list);
    }
    return ok(def, {
      movie: { id: movie.id, title: movie.title },
      departments: [...departments.entries()].map(([department, names]) => ({ department, names: names.slice(0, 6) })),
    });
  }

  if (def.slug === "crew-influence" || def.slug === "creative-team-dna") {
    const ids = [...new Set([...favorites, ...history])].slice(0, 5);
    if (!ids.length) return need(def, "Add favorites or history.");
    const crewMap = new Map<string, { name: string; count: number; jobs: Set<string> }>();
    for (const id of ids) {
      const movie = await getMovie(id);
      if (!movie) continue;
      for (const member of movie.credits.crew) {
        const key = `${member.id}`;
        const entry = crewMap.get(key) ?? { name: member.name, count: 0, jobs: new Set<string>() };
        entry.count += 1;
        if (member.job) entry.jobs.add(member.job);
        crewMap.set(key, entry);
      }
    }
    const recurring = [...crewMap.values()]
      .filter((c) => c.count >= 2)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map((c) => ({ name: c.name, sharedTitles: c.count, roles: [...c.jobs] }));
    const dna = await computeTasteDna(ids);
    return ok(
      def,
      {
        recurringCrew: recurring,
        tasteGenres: dna.genres.slice(0, 5),
        insight:
          def.slug === "creative-team-dna"
            ? "Recurring crew across your library may explain tonal consistency."
            : "Crew members spanning multiple favorites — explore their other credits.",
      },
      [trustBadge("metadata"), trustBadge("user")],
    );
  }

  if (def.slug === "universe-map") {
    if (!collectionId) return need(def, "Provide collectionId.");
    const franchise = await analyzeFranchise(collectionId, history);
    return ok(def, {
      franchise,
      map: franchise.chronological.map((m, i) => ({
        order: i + 1,
        id: m.id,
        title: m.title,
        year: m.year,
        watched: history.includes(m.id),
      })),
    });
  }

  if (def.slug === "adaptation-tracker") {
    const data = await findSpinOffs(collectionId);
    return ok(def, {
      ...data,
      disclaimer: "Lists TMDB collection-linked titles and search hints — not verified adaptation lineage unless explicitly sourced.",
    });
  }

  if (def.slug === "remake-evolution") {
    const a = Number(input.collectionIdA ?? collectionId);
    const b = Number(input.collectionIdB ?? 9485);
    if (!a || !b) return need(def, "Provide collectionIdA and collectionIdB.");
    const data = await compareFranchises(a, b);
    return ok(def, {
      ...data,
      relationshipType: "thematic_franchise_comparison",
      disclaimer: "AI thematic comparison from TMDB collection metadata — not a verified remake relationship unless TMDB links collections.",
    });
  }

  if (def.slug === "friend-recs") {
    const friend = input.friendProfile as { label: string; movieIds: number[] } | undefined;
    if (!friend?.movieIds?.length) {
      return need(def, "Provide friendProfile with a permitted friend's movieIds — do not use synthetic friend data.");
    }
    const pick = await groupPick([{ label: "You", movieIds: favorites }, friend], history);
    return pick.pick
      ? ok(def, { ...pick, privacyNote: "Uses only explicitly supplied friend taste signals." }, [trustBadge("user"), trustBadge("ai_prediction")])
      : need(def, "Add friend taste signals.");
  }

  if (def.slug === "spoiler-rooms") {
    const roomCode = String(input.code ?? input.roomCode ?? "");
    if (!roomCode) return need(def, "Open or create a movie room (room code required) for spoiler-controlled discussion.");
    if (!movieId) return need(def, "Provide movieId for spoiler-safe room context.");
    const briefing = await buildMovieBriefing(movieId, "none");
    return ok(def, {
      briefing,
      roomCode,
      roomRoute: `/rooms/${roomCode}`,
      policy: "Spoiler depth must be enforced by room settings — briefing starts spoiler-free.",
    });
  }

  if (def.slug === "sentiment-map") {
    const ids = [...new Set([...favorites, ...history])];
    if (!ids.length) return need(def, "Add favorites or history.");
    const dna = await computeTasteDna(ids);
    const tasteSentiment = dna.genres.slice(0, 8).map((g) => ({
      genre: g.name,
      weight: g.percent,
      tone: g.percent > 20 ? "dominant" : g.percent > 10 ? "frequent" : "occasional",
    }));
    return ok(
      def,
      {
        tasteSentimentFromLibrary: tasteSentiment,
        decades: dna.decades.slice(0, 5),
        disclaimer: "Derived from your FlutterFilms library only — not broad internet review sentiment.",
      },
      [trustBadge("user")],
    );
  }

  if (def.slug === "rewatch-reflection") {
    if (!movieId) return need(def, "Select a movie you rewatched.");
    const briefing = await buildMovieBriefing(movieId, "light");
    return ok(def, {
      prompts: [
        "What felt different on this rewatch?",
        "Which detail landed harder the second time?",
        "Would you recommend this as a rewatch or first-watch title?",
      ],
      briefing,
      labels: [trustBadge("metadata"), trustBadge("user")],
    });
  }

  if (def.slug === "quote-search") {
    const query = String(input.query ?? "");
    if (!query.trim()) return need(def, "Enter a quote fragment or line you remember.");
    const result = await semanticSearch(query, "general");
    return ok(
      def,
      { ...result, hint: "Quote memory search uses catalog keywords and overviews — not a verified quote database." },
      result.labels ?? [trustBadge("metadata")],
    );
  }

  return need(def, "Provide required input.");
}
