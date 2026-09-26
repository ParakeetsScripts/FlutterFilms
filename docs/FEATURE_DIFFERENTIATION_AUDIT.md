# FlutterFilms — Feature Differentiation Audit

Generated: 2026-09-26T19:02:30.835Z

## Summary

- **Total catalog:** 200
- **LIVE:** 47
- **BETA:** 153
- **PLANNED:** 0
- **Acceptance contracts:** 53

| ID | Slug | Name | Category | Tier | Mode | Status | Has Contract |
| ---: | --- | --- | --- | --- | --- | --- | --- |
| 1 | movie-interview | AI Movie Interview | discovery | distinct | DETERMINISTIC | live | yes |
| 2 | vibe-search | Vibe Search | discovery | distinct | HYBRID | beta | no |
| 3 | emotion-timeline | Emotion Timeline Search | discovery | generic_prompt | GENERATIVE_AI | beta | no |
| 4 | energy-slider | Energy Slider | discovery | distinct | DETERMINISTIC | beta | no |
| 5 | brain-level | Brain Level Selector | discovery | distinct | DETERMINISTIC | beta | no |
| 6 | attention-requirement | Attention Requirement | discovery | family_variant | DETERMINISTIC | beta | no |
| 7 | background-mode | Background Movie Mode | discovery | distinct | DETERMINISTIC | live | yes |
| 8 | no-skip-mode | No-Skip Mode | discovery | distinct | DETERMINISTIC | beta | no |
| 9 | instant-pick | Instant Recommendation | discovery | distinct | DETERMINISTIC | live | yes |
| 10 | movie-roulette | AI Movie Roulette | discovery | distinct | DETERMINISTIC | live | yes |
| 11 | anti-algorithm | Anti-Algorithm Mode | discovery | distinct | DETERMINISTIC | live | yes |
| 12 | taste-expansion | Taste Expansion Mode | discovery | distinct | DETERMINISTIC | live | yes |
| 13 | micro-genre | Micro-Genre Discovery | discovery | generic_prompt | HYBRID | beta | no |
| 14 | movie-dna | Movie DNA Matching | discovery | distinct | DETERMINISTIC | live | yes |
| 15 | context-aware | Context-Aware Recommendations | discovery | distinct | DETERMINISTIC | beta | no |
| 16 | movie-briefing | AI Movie Briefing | movie | distinct | HYBRID | live | yes |
| 17 | first-time-guide | First-Time Viewer Guide | movie | distinct | HYBRID | live | yes |
| 18 | spoiler-shield | Spoiler Shield Levels | movie | generic_prompt | GENERATIVE_AI | beta | no |
| 19 | character-primer | Character Primer | movie | generic_prompt | HYBRID | beta | no |
| 20 | world-primer | World Primer | movie | generic_prompt | HYBRID | beta | no |
| 21 | franchise-catchup | Franchise Catch-Up | movie | distinct | DETERMINISTIC | live | yes |
| 22 | ending-explanation | Ending Explanation | movie | generic_prompt | GENERATIVE_AI | beta | no |
| 23 | theme-explorer | Theme Explorer | movie | generic_prompt | HYBRID | beta | no |
| 24 | motif-explorer | Motif Explorer | movie | generic_prompt | HYBRID | beta | no |
| 25 | symbolism-mode | Symbolism Mode | movie | generic_prompt | HYBRID | beta | no |
| 26 | filmmaking-breakdown | Filmmaking Breakdown | movie | generic_prompt | HYBRID | beta | no |
| 27 | director-intent | Director Intent Research | movie | generic_prompt | HYBRID | beta | no |
| 28 | production-challenges | Production Challenge Timeline | movie | generic_prompt | DETERMINISTIC | beta | no |
| 29 | location-intelligence | Location Intelligence | movie | distinct | DETERMINISTIC | live | yes |
| 30 | version-comparison | Version Comparison | movie | distinct | DETERMINISTIC | live | yes |
| 31 | actor-similarity | Actor Similarity Search | people | distinct | DETERMINISTIC | live | yes |
| 32 | director-similarity | Director Similarity Search | people | distinct | DETERMINISTIC | live | yes |
| 33 | actor-chemistry | Actor Chemistry Explorer | people | distinct | HYBRID | live | yes |
| 34 | collaboration-graph | Collaboration Graph | people | distinct | DETERMINISTIC | live | yes |
| 35 | career-turning-points | Career Turning Points | people | family_differentiated | DETERMINISTIC | beta | no |
| 36 | filmography-journey | Filmography Journey | people | family_differentiated | DETERMINISTIC | beta | no |
| 37 | underseen-actor | Underseen Actor Finder | people | family_variant | DETERMINISTIC | beta | no |
| 38 | crew-discovery | Crew Discovery | people | distinct | DETERMINISTIC | live | yes |
| 39 | crew-influence | Crew Influence Graph | people | distinct | DETERMINISTIC | live | yes |
| 40 | creative-team-dna | Creative Team DNA | people | distinct | DETERMINISTIC | live | yes |
| 41 | franchise-health | Franchise Health Dashboard | franchise | distinct | DETERMINISTIC | live | yes |
| 42 | timeline-conflicts | Timeline Conflict Detector | franchise | distinct | DETERMINISTIC | live | yes |
| 43 | watch-order | Watch Order Explainer | franchise | distinct | DETERMINISTIC | live | yes |
| 44 | franchise-entry | Franchise Entry Recommender | franchise | family_differentiated | DETERMINISTIC | live | yes |
| 45 | franchise-completion | Franchise Completion Tracker | franchise | distinct | DETERMINISTIC | live | yes |
| 46 | universe-map | Universe Relationship Map | franchise | distinct | DETERMINISTIC | live | yes |
| 47 | franchise-similarity | Franchise Similarity Engine | franchise | distinct | DETERMINISTIC | live | yes |
| 48 | spin-off-discovery | Spin-Off Discovery | franchise | distinct | DETERMINISTIC | live | yes |
| 49 | adaptation-tracker | Adaptation Tracker | franchise | distinct | DETERMINISTIC | live | yes |
| 50 | remake-evolution | Remake Evolution View | franchise | distinct | DETERMINISTIC | live | yes |
| 51 | taste-dna-2 | Taste DNA 2.0 | personal | distinct | DETERMINISTIC | live | yes |
| 52 | taste-contradiction | Taste Contradiction Detector | personal | distinct | DETERMINISTIC | live | yes |
| 53 | favorite-patterns | Favorite Pattern Finder | personal | distinct | DETERMINISTIC | live | yes |
| 54 | regret-predictor | Regret Predictor | personal | family_variant | HYBRID | beta | no |
| 55 | rewatch-probability | Rewatch Probability | personal | distinct | DETERMINISTIC | live | yes |
| 56 | taste-evolution | Taste Evolution Timeline | personal | distinct | DETERMINISTIC | live | yes |
| 57 | personality-card | Movie Personality Card | personal | distinct | HYBRID | live | yes |
| 58 | genre-map | Personal Genre Map | personal | distinct | DETERMINISTIC | live | yes |
| 59 | decade-map | Decade Map | personal | distinct | DETERMINISTIC | live | yes |
| 60 | global-cinema-map | Global Cinema Map | personal | distinct | DETERMINISTIC | live | yes |
| 61 | group-picker | AI Group Picker | social | distinct | DETERMINISTIC | live | yes |
| 62 | taste-intersection | Taste Intersection Graph | social | distinct | DETERMINISTIC | live | yes |
| 63 | friend-recs | Friend Recommendation Assistant | social | metadata_only | DETERMINISTIC | beta | no |
| 64 | shared-watchlists | Shared Watchlists | social | distinct | DETERMINISTIC | beta | no |
| 65 | movie-room | Movie Room | social | distinct | DETERMINISTIC | beta | no |
| 66 | debate-mode | AI Debate Mode | social | generic_prompt | GENERATIVE_AI | beta | no |
| 67 | spoiler-rooms | Spoiler-Protected Rooms | social | generic_prompt | DETERMINISTIC | beta | no |
| 68 | discussion-starter | AI Discussion Starter | social | generic_prompt | GENERATIVE_AI | beta | no |
| 69 | sentiment-map | Community Sentiment Map | social | metadata_only | HYBRID | beta | no |
| 70 | taste-match | Taste Match Percentage | social | distinct | DETERMINISTIC | live | yes |
| 71 | smart-resume | Smart Resume | watching | distinct | DETERMINISTIC | beta | no |
| 72 | session-planner | Watch Session Planner | watching | family_variant | DETERMINISTIC | beta | no |
| 73 | double-feature | Double Feature Optimizer | watching | distinct | DETERMINISTIC | live | yes |
| 74 | weekend-marathon | Weekend Marathon Builder | watching | distinct | DETERMINISTIC | beta | no |
| 75 | family-planner | Family Movie Planner | watching | family_variant | DETERMINISTIC | beta | no |
| 76 | short-on-time | Short-On-Time Mode | watching | distinct | DETERMINISTIC | beta | no |
| 77 | food-pairing | Movie + Food Pairing | watching | generic_prompt | GENERATIVE_AI | beta | no |
| 78 | atmosphere-mode | Movie Atmosphere Mode | watching | generic_prompt | GENERATIVE_AI | beta | no |
| 79 | post-reflection | Post-Movie Reflection | watching | distinct | DETERMINISTIC | live | yes |
| 80 | rewatch-reflection | Rewatch Reflection | watching | generic_prompt | DETERMINISTIC | beta | no |
| 81 | scene-memory | Scene Memory Search | search | distinct | DETERMINISTIC | beta | yes |
| 82 | quote-search | Partial Quote Search | search | metadata_only | DETERMINISTIC | beta | yes |
| 83 | visual-description | Visual Description Search | search | metadata_only | HYBRID | beta | no |
| 84 | remember-wizard | I Remember This Movie | search | distinct | DETERMINISTIC | live | yes |
| 85 | nl-filters | Natural-Language Filters | search | distinct | DETERMINISTIC | beta | yes |
| 86 | narrative-structure | Narrative Structure Search | search | metadata_only | GENERATIVE_AI | beta | no |
| 87 | pacing-search | Pacing Pattern Search | search | metadata_only | GENERATIVE_AI | beta | no |
| 88 | character-arc | Character Arc Search | search | metadata_only | GENERATIVE_AI | beta | no |
| 89 | relationship-search | Relationship Dynamics Search | search | metadata_only | HYBRID | beta | no |
| 90 | semantic-catalog | Smart Catalog Search | search | distinct | HYBRID | beta | yes |
| 91 | poster-generator | Poster Concept Builder | creative | family_variant | HYBRID | beta | yes |
| 92 | watchlist-poster | AI Watchlist Poster | creative | family_variant | HYBRID | beta | no |
| 93 | movie-night-card | AI Movie Night Card | creative | family_variant | HYBRID | beta | no |
| 94 | franchise-graphic | AI Franchise Timeline Graphic | creative | family_differentiated | HYBRID | beta | no |
| 95 | comparison-graphic | AI Comparison Graphic | creative | family_variant | HYBRID | beta | no |
| 96 | trailer-concept | AI Trailer Concept | creative | family_variant | GENERATIVE_AI | beta | no |
| 97 | review-assistant | AI Review Assistant | creative | family_variant | GENERATIVE_AI | beta | no |
| 98 | cinema-newsletter | AI Cinema Newsletter | creative | family_variant | GENERATIVE_AI | beta | no |
| 99 | weekly-brief | AI Weekly Discovery Brief | creative | distinct | GENERATIVE_AI | beta | no |
| 100 | cinema-agent | Cinema Agent Mode | agent | distinct | GENERATIVE_AI | beta | yes |
| 101 | movie-vs-movie | Movie vs Movie | movie | distinct | DETERMINISTIC | live | yes |
| 102 | movie-similarity | Movie Similarity | movie | family_variant | DETERMINISTIC | beta | no |
| 103 | tone-similarity | Tone Similarity | movie | family_variant | DETERMINISTIC | beta | no |
| 104 | theme-similarity | Theme Similarity | movie | family_variant | DETERMINISTIC | beta | no |
| 105 | genre-similarity-compare | Genre Similarity | movie | family_variant | DETERMINISTIC | beta | no |
| 106 | runtime-similarity | Runtime Similarity | movie | family_variant | DETERMINISTIC | beta | no |
| 107 | cast-similarity | Cast Similarity | movie | family_variant | DETERMINISTIC | beta | no |
| 108 | director-similarity-match | Director Similarity Match | movie | family_variant | DETERMINISTIC | beta | no |
| 109 | crew-similarity | Crew Similarity | movie | family_variant | DETERMINISTIC | beta | no |
| 110 | era-similarity | Era Similarity | movie | family_variant | DETERMINISTIC | beta | no |
| 111 | language-similarity | Language Similarity | movie | family_variant | DETERMINISTIC | beta | no |
| 112 | country-similarity | Production Country Similarity | movie | family_variant | DETERMINISTIC | beta | no |
| 113 | franchise-similarity-match | Franchise Similarity | franchise | family_variant | DETERMINISTIC | beta | no |
| 114 | audience-similarity | Audience Similarity | movie | family_variant | DETERMINISTIC | beta | no |
| 115 | like-darker | Like This but Darker | discovery | family_variant | DETERMINISTIC | beta | no |
| 116 | like-lighter | Like This but Lighter | discovery | family_variant | DETERMINISTIC | beta | no |
| 117 | like-shorter | Like This but Shorter | discovery | family_variant | DETERMINISTIC | beta | no |
| 118 | like-more-serious | Like This but More Serious | discovery | family_variant | DETERMINISTIC | beta | no |
| 119 | like-less-violent | Like This but Less Violent | discovery | family_variant | DETERMINISTIC | beta | no |
| 120 | like-more-mainstream | Like This but More Mainstream | discovery | family_variant | DETERMINISTIC | beta | no |
| 121 | writer-similarity | Writer Similarity | people | family_variant | DETERMINISTIC | beta | no |
| 122 | producer-similarity | Producer Similarity | people | family_variant | DETERMINISTIC | beta | no |
| 123 | cinematographer-similarity | Cinematographer Similarity | people | family_variant | DETERMINISTIC | beta | no |
| 124 | editor-similarity | Editor Similarity | people | family_variant | DETERMINISTIC | beta | no |
| 125 | composer-similarity | Composer Similarity | people | family_variant | DETERMINISTIC | beta | no |
| 126 | actor-career-timeline | Actor Career Timeline | people | family_differentiated | DETERMINISTIC | beta | no |
| 127 | director-career-timeline | Director Career Timeline | people | family_differentiated | DETERMINISTIC | beta | no |
| 128 | writer-career-timeline | Writer Career Timeline | people | family_differentiated | DETERMINISTIC | beta | no |
| 129 | frequent-collaborators | Frequent Collaborators | people | family_differentiated | DETERMINISTIC | beta | no |
| 130 | career-breakthrough-analysis | Career Breakthrough Analysis | people | family_differentiated | DETERMINISTIC | beta | no |
| 131 | filmography-explorer | Filmography Explorer | people | family_differentiated | DETERMINISTIC | beta | no |
| 132 | shared-cast-discovery | Shared Cast Discovery | people | family_differentiated | DETERMINISTIC | beta | no |
| 133 | shared-crew-discovery | Shared Crew Discovery | people | family_differentiated | DETERMINISTIC | beta | no |
| 134 | what-else-they-made | What Else Did They Make? | people | family_variant | DETERMINISTIC | beta | no |
| 135 | people-discovery-taste | People Discovery by Taste | people | family_variant | DETERMINISTIC | beta | no |
| 136 | people-discovery-filmography | People Discovery by Filmography | people | family_variant | DETERMINISTIC | beta | no |
| 137 | crew-role-explorer | Crew Role Explorer | people | family_variant | DETERMINISTIC | beta | no |
| 138 | casting-pattern-finder | Casting Pattern Finder | people | family_variant | DETERMINISTIC | beta | no |
| 139 | director-style-signature | Director Style Signature | people | family_variant | DETERMINISTIC | beta | no |
| 140 | performer-range-analysis | Performer Range Analysis | people | family_variant | DETERMINISTIC | beta | no |
| 141 | franchise-map-visual | Franchise Map | franchise | family_differentiated | DETERMINISTIC | beta | no |
| 142 | franchise-timeline-ordered | Franchise Timeline | franchise | family_differentiated | DETERMINISTIC | beta | no |
| 143 | franchise-release-order | Release Order | franchise | family_differentiated | DETERMINISTIC | beta | no |
| 144 | franchise-chronological-order | Chronological Order | franchise | family_differentiated | DETERMINISTIC | beta | no |
| 145 | franchise-entry-point | Franchise Entry Point | franchise | family_differentiated | DETERMINISTIC | beta | no |
| 146 | franchise-watch-order-planner | Franchise Watch Order | franchise | family_variant | DETERMINISTIC | beta | no |
| 147 | franchise-similarity-engine | Franchise Similarity Engine | franchise | family_variant | DETERMINISTIC | beta | no |
| 148 | franchise-spin-off-finder | Franchise Spin-Off Finder | franchise | family_differentiated | DETERMINISTIC | beta | no |
| 149 | franchise-remake-tracker | Franchise Remake Tracker | franchise | family_differentiated | DETERMINISTIC | beta | no |
| 150 | franchise-adaptation-tracker | Franchise Adaptation Tracker | franchise | family_differentiated | DETERMINISTIC | beta | no |
| 151 | franchise-cast-timeline | Franchise Cast Evolution | franchise | family_differentiated | DETERMINISTIC | beta | no |
| 152 | franchise-crew-timeline | Franchise Crew Evolution | franchise | family_differentiated | DETERMINISTIC | beta | no |
| 153 | franchise-runtime-chart | Franchise Runtime Evolution | franchise | family_differentiated | DETERMINISTIC | beta | no |
| 154 | franchise-rating-trend | Franchise Rating Evolution | franchise | family_differentiated | DETERMINISTIC | beta | no |
| 155 | franchise-genre-shift | Franchise Genre Evolution | franchise | family_differentiated | DETERMINISTIC | beta | no |
| 156 | franchise-gap-finder | Franchise Gap Analysis | franchise | family_differentiated | DETERMINISTIC | beta | no |
| 157 | franchise-missing-movies | Franchise Missing-Movie Detector | franchise | family_differentiated | DETERMINISTIC | beta | no |
| 158 | franchise-marathon-planner | Franchise Marathon Builder | franchise | family_differentiated | DETERMINISTIC | beta | no |
| 159 | franchise-personal-plan | Franchise Personal Completion Plan | franchise | family_differentiated | DETERMINISTIC | beta | no |
| 160 | franchise-completion-report | Franchise Completion Report | franchise | family_differentiated | DETERMINISTIC | beta | no |
| 161 | favorite-actors-rank | Favorite Actors | personal | family_differentiated | DETERMINISTIC | beta | no |
| 162 | favorite-directors-rank | Favorite Directors | personal | family_differentiated | DETERMINISTIC | beta | no |
| 163 | favorite-writers-rank | Favorite Writers | personal | family_differentiated | DETERMINISTIC | beta | no |
| 164 | favorite-languages-rank | Favorite Languages | personal | family_differentiated | DETERMINISTIC | beta | no |
| 165 | favorite-countries-rank | Favorite Countries | personal | family_differentiated | DETERMINISTIC | beta | no |
| 166 | runtime-taste-preference | Runtime Preference | personal | family_differentiated | DETERMINISTIC | beta | no |
| 167 | rating-taste-preference | Rating Preference | personal | family_differentiated | DETERMINISTIC | beta | no |
| 168 | rewatch-signal-analysis | Rewatch Signals | personal | family_differentiated | DETERMINISTIC | live | yes |
| 169 | discovery-diversity-score | Discovery Diversity | personal | family_variant | DETERMINISTIC | beta | no |
| 170 | familiarity-balance | Familiarity Preference | personal | family_variant | DETERMINISTIC | beta | no |
| 171 | mainstream-niche-score | Mainstream vs Niche | personal | family_variant | DETERMINISTIC | beta | no |
| 172 | taste-expansion-suggestions | Taste Expansion Opportunities | personal | family_differentiated | HYBRID | beta | no |
| 173 | taste-blind-spot-finder | Taste Blind Spots | personal | family_differentiated | HYBRID | beta | no |
| 174 | why-this-movie | Why This Movie? | discovery | family_variant | HYBRID | beta | no |
| 175 | why-not-this-movie | Why Not This Movie? | discovery | family_variant | HYBRID | beta | no |
| 176 | tonight-picker | Tonight Picker | watching | route_only | DETERMINISTIC | beta | no |
| 177 | triple-feature | Triple Feature | watching | family_variant | DETERMINISTIC | beta | no |
| 178 | weekly-movie-plan | Weekly Movie Plan | watching | family_variant | DETERMINISTIC | beta | no |
| 179 | couple-planner | Couple Movie Planner | watching | family_variant | DETERMINISTIC | beta | no |
| 180 | anti-regret-picker | Anti-Regret Picker | discovery | family_variant | DETERMINISTIC | beta | no |
| 181 | rewatch-picker | Rewatch Picker | watching | family_differentiated | DETERMINISTIC | beta | no |
| 182 | discovery-challenge | Discovery Challenge | discovery | family_variant | DETERMINISTIC | beta | no |
| 183 | one-movie-commitment | One-Movie Commitment | discovery | family_variant | DETERMINISTIC | beta | no |
| 184 | surprised-pick | You Might Be Surprised | discovery | family_variant | DETERMINISTIC | beta | no |
| 185 | comfort-zone-pick | Outside Your Comfort Zone | discovery | family_variant | DETERMINISTIC | beta | no |
| 186 | more-like-favorites | More Like Your Favorites | discovery | family_variant | DETERMINISTIC | beta | no |
| 187 | least-like-favorites | Least Like Your Favorites | discovery | family_variant | DETERMINISTIC | beta | no |
| 188 | watch-journey | Personalized Watch Journey | watching | family_variant | DETERMINISTIC | beta | no |
| 189 | attention-session-planner | Attention Session Planner | watching | family_variant | DETERMINISTIC | beta | no |
| 190 | late-night-picker | Late-Night Picker | watching | family_variant | DETERMINISTIC | beta | no |
| 191 | morning-movie-picker | Morning Picker | watching | family_variant | DETERMINISTIC | beta | no |
| 192 | watchlist-prioritizer | Watchlist Prioritizer | watching | family_differentiated | DETERMINISTIC | live | yes |
| 193 | watchlist-randomizer | Watchlist Randomizer | watching | family_differentiated | DETERMINISTIC | beta | no |
| 194 | what-watch-next | What Should I Watch Next? | watching | family_variant | DETERMINISTIC | beta | no |
| 195 | group-taste-merge | Group Taste Merge | social | family_differentiated | DETERMINISTIC | beta | no |
| 196 | room-consensus | Room Consensus | social | metadata_only | DETERMINISTIC | beta | no |
| 197 | room-tie-breaker | Room Tie Breaker | social | metadata_only | DETERMINISTIC | beta | no |
| 198 | taste-report | Taste Report | personal | family_differentiated | DETERMINISTIC | beta | no |
| 199 | cinema-command-center | Cinema Command Center | agent | route_only | DETERMINISTIC | beta | no |
| 200 | cinema-agent-memory-hub | Cinema Agent Memory | agent | route_only | DETERMINISTIC | beta | no |