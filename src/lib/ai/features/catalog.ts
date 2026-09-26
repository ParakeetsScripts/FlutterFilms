export type FeatureCategory =
  | "discovery"
  | "movie"
  | "people"
  | "franchise"
  | "personal"
  | "social"
  | "watching"
  | "search"
  | "creative"
  | "agent";

export type FeatureCatalogEntry = {
  id: number;
  slug: string;
  title: string;
  category: FeatureCategory;
  description: string;
  href?: string;
  api?: string;
};

export const FEATURE_CATALOG: FeatureCatalogEntry[] = [
  { id: 1, slug: "movie-interview", title: "AI Movie Interview", category: "discovery", description: "Answer guided questions to build your movie profile.", href: "/my-cinema/interview", api: "/api/ai/interview" },
  { id: 2, slug: "vibe-search", title: "Vibe Search", category: "discovery", description: "Search by mood, atmosphere, and feeling.", href: "/intelligence/discover", api: "/api/ai/vibe-search" },
  { id: 3, slug: "emotion-timeline", title: "Emotion Timeline Search", category: "discovery", description: "Find films by emotional intensity patterns.", href: "/intelligence/discover" },
  { id: 4, slug: "energy-slider", title: "Energy Slider", category: "discovery", description: "Low, balanced, or high-energy picks.", href: "/intelligence/discover" },
  { id: 5, slug: "brain-level", title: "Brain Level Selector", category: "discovery", description: "Casual to extremely challenging films.", href: "/intelligence/discover" },
  { id: 6, slug: "attention-requirement", title: "Attention Requirement", category: "discovery", description: "Multitask-friendly vs full-attention films.", href: "/intelligence/discover" },
  { id: 7, slug: "background-mode", title: "Background Movie Mode", category: "discovery", description: "Casual watching recommendations.", href: "/intelligence/discover", api: "/api/ai/recommend" },
  { id: 8, slug: "no-skip-mode", title: "No-Skip Mode", category: "discovery", description: "High-engagement picks from your history.", href: "/intelligence/discover" },
  { id: 9, slug: "instant-pick", title: "Instant Recommendation", category: "discovery", description: "One tap, one personalized movie.", api: "/api/ai/recommend" },
  { id: 10, slug: "movie-roulette", title: "AI Movie Roulette", category: "discovery", description: "Controlled randomness from your taste.", api: "/api/ai/recommend" },
  { id: 11, slug: "anti-algorithm", title: "Anti-Algorithm Mode", category: "discovery", description: "Recommend outside your usual preferences.", api: "/api/ai/recommend" },
  { id: 12, slug: "taste-expansion", title: "Taste Expansion Mode", category: "discovery", description: "Gentle genre exploration.", api: "/api/ai/recommend" },
  { id: 13, slug: "micro-genre", title: "Micro-Genre Discovery", category: "discovery", description: "Niche genre combinations.", href: "/intelligence/discover" },
  { id: 14, slug: "movie-dna", title: "Movie DNA Matching", category: "discovery", description: "Attribute-level taste matching.", href: "/my-cinema" },
  { id: 15, slug: "context-aware", title: "Context-Aware Recommendations", category: "discovery", description: "Time, duration, and watchlist context.", api: "/api/ai/recommend" },
  { id: 16, slug: "movie-briefing", title: "AI Movie Briefing", category: "movie", description: "One-minute pre-watch briefing.", api: "/api/ai/briefing" },
  { id: 17, slug: "first-time-guide", title: "First-Time Viewer Guide", category: "movie", description: "What to know before watching.", api: "/api/ai/briefing" },
  { id: 18, slug: "spoiler-shield", title: "Spoiler Shield Levels", category: "movie", description: "None, light, moderate, full protection.", href: "/copilot" },
  { id: 19, slug: "character-primer", title: "Character Primer", category: "movie", description: "Meet the cast without spoilers.", api: "/api/ai/briefing" },
  { id: 20, slug: "world-primer", title: "World Primer", category: "movie", description: "Universe context before watching.", api: "/api/ai/briefing" },
  { id: 21, slug: "franchise-catchup", title: "Franchise Catch-Up", category: "movie", description: "Summarize prior entries.", href: "/franchises" },
  { id: 22, slug: "ending-explanation", title: "Ending Explanation", category: "movie", description: "After explicit confirmation only.", href: "/copilot" },
  { id: 23, slug: "theme-explorer", title: "Theme Explorer", category: "movie", description: "Source-backed themes + interpretation.", api: "/api/ai/briefing" },
  { id: 24, slug: "motif-explorer", title: "Motif Explorer", category: "movie", description: "Recurring visual and narrative motifs.", api: "/api/ai/briefing" },
  { id: 25, slug: "symbolism-mode", title: "Symbolism Mode", category: "movie", description: "Documented vs interpretive symbolism.", href: "/copilot" },
  { id: 26, slug: "filmmaking-breakdown", title: "Filmmaking Breakdown", category: "movie", description: "Craft-focused analysis.", api: "/api/ai/briefing" },
  { id: 27, slug: "director-intent", title: "Director Intent Research", category: "movie", description: "Documented statements and interviews." },
  { id: 28, slug: "production-challenges", title: "Production Challenge Timeline", category: "movie", description: "Documented production history." },
  { id: 29, slug: "location-intelligence", title: "Location Intelligence", category: "movie", description: "Filming locations and maps." },
  { id: 30, slug: "version-comparison", title: "Version Comparison", category: "movie", description: "Theatrical vs extended cuts." },
  { id: 31, slug: "actor-similarity", title: "Actor Similarity Search", category: "people", description: "Performers with similar patterns.", href: "/person", api: "/api/ai/people" },
  { id: 32, slug: "director-similarity", title: "Director Similarity Search", category: "people", description: "Directors by style and career.", href: "/person", api: "/api/ai/people" },
  { id: 33, slug: "actor-chemistry", title: "Actor Chemistry Explorer", category: "people", description: "Recurring co-stars.", href: "/person" },
  { id: 34, slug: "collaboration-graph", title: "Collaboration Graph", category: "people", description: "Creative network visualization." },
  { id: 35, slug: "career-turning-points", title: "Career Turning Points", category: "people", description: "Documented career shifts.", href: "/person", api: "/api/ai/people" },
  { id: 36, slug: "filmography-journey", title: "Filmography Journey", category: "people", description: "Curated path through a career.", href: "/person", api: "/api/ai/people" },
  { id: 37, slug: "underseen-actor", title: "Underseen Actor Finder", category: "people", description: "Lesser-known talent discovery." },
  { id: 38, slug: "crew-discovery", title: "Crew Discovery", category: "people", description: "Explore key crew roles." },
  { id: 39, slug: "crew-influence", title: "Crew Influence Graph", category: "people", description: "Cross-project connections." },
  { id: 40, slug: "creative-team-dna", title: "Creative Team DNA", category: "people", description: "Recurring team characteristics." },
  { id: 41, slug: "franchise-health", title: "Franchise Health Dashboard", category: "franchise", description: "Ratings and release visualization.", href: "/franchises", api: "/api/ai/franchise" },
  { id: 42, slug: "timeline-conflicts", title: "Timeline Conflict Detector", category: "franchise", description: "Continuity flagging from data." },
  { id: 43, slug: "watch-order", title: "Watch Order Explainer", category: "franchise", description: "Release vs chronological order.", href: "/collection" },
  { id: 44, slug: "franchise-entry", title: "Franchise Entry Recommender", category: "franchise", description: "Best starting point for newcomers.", api: "/api/ai/franchise" },
  { id: 45, slug: "franchise-completion", title: "Franchise Completion Tracker", category: "franchise", description: "Track watched entries.", href: "/my-cinema" },
  { id: 46, slug: "universe-map", title: "Universe Relationship Map", category: "franchise", description: "Connected works visualization." },
  { id: 47, slug: "franchise-similarity", title: "Franchise Similarity Engine", category: "franchise", description: "Compare entire franchises." },
  { id: 48, slug: "spin-off-discovery", title: "Spin-Off Discovery", category: "franchise", description: "Related side stories." },
  { id: 49, slug: "adaptation-tracker", title: "Adaptation Tracker", category: "franchise", description: "Books, games, and prior adaptations." },
  { id: 50, slug: "remake-evolution", title: "Remake Evolution View", category: "franchise", description: "Compare story versions." },
  { id: 51, slug: "taste-dna-2", title: "Taste DNA 2.0", category: "personal", description: "Living taste profile from your library.", href: "/my-cinema", api: "/api/ai/taste" },
  { id: 52, slug: "taste-contradiction", title: "Taste Contradiction Detector", category: "personal", description: "Surprising preference patterns.", href: "/my-cinema" },
  { id: 53, slug: "favorite-patterns", title: "Favorite Pattern Finder", category: "personal", description: "What your favorites share.", href: "/my-cinema" },
  { id: 54, slug: "regret-predictor", title: "Regret Predictor", category: "personal", description: "Prediction — may not match taste.", api: "/api/ai/recommend" },
  { id: 55, slug: "rewatch-probability", title: "Rewatch Probability", category: "personal", description: "Films matching rewatch habits.", href: "/my-cinema" },
  { id: 56, slug: "taste-evolution", title: "Taste Evolution Timeline", category: "personal", description: "How preferences changed.", href: "/my-cinema" },
  { id: 57, slug: "personality-card", title: "Movie Personality Card", category: "personal", description: "Shareable taste visual.", href: "/my-cinema", api: "/api/ai/taste" },
  { id: 58, slug: "genre-map", title: "Personal Genre Map", category: "personal", description: "Preferred and unexplored genres.", href: "/my-cinema" },
  { id: 59, slug: "decade-map", title: "Decade Map", category: "personal", description: "Decades in your viewing.", href: "/my-cinema" },
  { id: 60, slug: "global-cinema-map", title: "Global Cinema Map", category: "personal", description: "Countries in your history.", href: "/my-cinema" },
  { id: 61, slug: "group-picker", title: "AI Group Picker", category: "social", description: "Pick for multiple tastes.", href: "/community", api: "/api/ai/social" },
  { id: 62, slug: "taste-intersection", title: "Taste Intersection Graph", category: "social", description: "Overlapping preferences.", href: "/community", api: "/api/ai/social" },
  { id: 63, slug: "friend-recs", title: "Friend Recommendation Assistant", category: "social", description: "Recs from public taste profiles." },
  { id: 64, slug: "shared-watchlists", title: "Shared Watchlists", category: "social", description: "Collaborative lists with permissions.", href: "/watchlists", api: "/api/watchlists" },
  { id: 65, slug: "movie-room", title: "Movie Room", category: "social", description: "Shared decision space.", href: "/rooms", api: "/api/rooms" },
  { id: 66, slug: "debate-mode", title: "AI Debate Mode", category: "social", description: "Summarize differing opinions.", href: "/copilot" },
  { id: 67, slug: "spoiler-rooms", title: "Spoiler-Protected Rooms", category: "social", description: "Discussion by spoiler level." },
  { id: 68, slug: "discussion-starter", title: "AI Discussion Starter", category: "social", description: "Spoiler-free questions.", href: "/copilot" },
  { id: 69, slug: "sentiment-map", title: "Community Sentiment Map", category: "social", description: "Audience reaction visualization." },
  { id: 70, slug: "taste-match", title: "Taste Match Percentage", category: "social", description: "Explain taste similarity.", href: "/community", api: "/api/ai/social" },
  { id: 71, slug: "smart-resume", title: "Smart Resume", category: "watching", description: "Resume authorized playback.", href: "/watchlist" },
  { id: 72, slug: "session-planner", title: "Watch Session Planner", category: "watching", description: "Schedule around available time.", api: "/api/ai/recommend" },
  { id: 73, slug: "double-feature", title: "Double Feature Optimizer", category: "watching", description: "Complementary two-movie pairings.", api: "/api/ai/recommend" },
  { id: 74, slug: "weekend-marathon", title: "Weekend Marathon Builder", category: "watching", description: "Multi-film personalized schedule.", api: "/api/ai/recommend", href: "/copilot" },
  { id: 75, slug: "family-planner", title: "Family Movie Planner", category: "watching", description: "Shared family-friendly filters.", api: "/api/ai/recommend" },
  { id: 76, slug: "short-on-time", title: "Short-On-Time Mode", category: "watching", description: "Films that fit remaining time.", api: "/api/ai/recommend" },
  { id: 77, slug: "food-pairing", title: "Movie + Food Pairing", category: "watching", description: "Themed food suggestions (AI).", href: "/copilot" },
  { id: 78, slug: "atmosphere-mode", title: "Movie Atmosphere Mode", category: "watching", description: "Themed movie night ideas.", href: "/copilot" },
  { id: 79, slug: "post-reflection", title: "Post-Movie Reflection", category: "watching", description: "Questions after viewing.", href: "/copilot" },
  { id: 80, slug: "rewatch-reflection", title: "Rewatch Reflection", category: "watching", description: "Track opinion changes." },
  { id: 81, slug: "scene-memory", title: "Scene Memory Search", category: "search", description: "Find films from vague scenes.", href: "/intelligence/remember", api: "/api/ai/semantic-search" },
  { id: 82, slug: "quote-search", title: "Partial Quote Search", category: "search", description: "Identify from remembered lines." },
  { id: 83, slug: "visual-description", title: "Visual Description Search", category: "search", description: "Search by imagery and setting.", api: "/api/ai/semantic-search" },
  { id: 84, slug: "remember-wizard", title: "I Remember This Movie", category: "search", description: "Guided identification wizard.", href: "/intelligence/remember" },
  { id: 85, slug: "nl-filters", title: "Natural-Language Filters", category: "search", description: "Complex queries in plain language.", api: "/api/ai/vibe-search" },
  { id: 86, slug: "narrative-structure", title: "Narrative Structure Search", category: "search", description: "Nonlinear, anthology, single-location.", api: "/api/ai/semantic-search" },
  { id: 87, slug: "pacing-search", title: "Pacing Pattern Search", category: "search", description: "Slow-burn vs constant action.", api: "/api/ai/semantic-search" },
  { id: 88, slug: "character-arc", title: "Character Arc Search", category: "search", description: "Redemption, revenge, coming-of-age.", api: "/api/ai/semantic-search" },
  { id: 89, slug: "relationship-search", title: "Relationship Dynamics Search", category: "search", description: "Rivals, mentors, ensembles.", api: "/api/ai/semantic-search" },
  { id: 90, slug: "semantic-catalog", title: "Semantic Catalog Search", category: "search", description: "Intelligent cross-field search.", api: "/api/ai/semantic-search" },
  { id: 91, slug: "poster-generator", title: "AI Poster Generator", category: "creative", description: "Fan/concept artwork (labeled AI).", href: "/images", api: "/api/ai/creative" },
  { id: 92, slug: "watchlist-poster", title: "AI Watchlist Poster", category: "creative", description: "Visual for your list.", href: "/images", api: "/api/ai/creative" },
  { id: 93, slug: "movie-night-card", title: "AI Movie Night Card", category: "creative", description: "Shareable invitation graphic.", href: "/images", api: "/api/ai/creative" },
  { id: 94, slug: "franchise-graphic", title: "AI Franchise Timeline Graphic", category: "creative", description: "Auto-generated timelines.", href: "/images", api: "/api/ai/creative" },
  { id: 95, slug: "comparison-graphic", title: "AI Comparison Graphic", category: "creative", description: "Shareable comparisons.", href: "/images", api: "/api/ai/creative" },
  { id: 96, slug: "trailer-concept", title: "AI Trailer Concept", category: "creative", description: "Hypothetical trailer script.", href: "/images", api: "/api/ai/creative" },
  { id: 97, slug: "review-assistant", title: "AI Review Assistant", category: "creative", description: "Structure your own review.", href: "/images", api: "/api/ai/creative" },
  { id: 98, slug: "cinema-newsletter", title: "AI Cinema Newsletter", category: "creative", description: "Personal weekly digest.", api: "/api/ai/weekly-brief" },
  { id: 99, slug: "weekly-brief", title: "AI Weekly Discovery Brief", category: "creative", description: "New, overlooked, and upcoming.", api: "/api/ai/weekly-brief", href: "/my-cinema" },
  { id: 100, slug: "cinema-agent", title: "Cinema Agent Mode", category: "agent", description: "Persistent movie agent across the platform.", href: "/copilot", api: "/api/ai/chat" },
];
