# Onboarding

Real-time taste building for FlutterFilms (v2).

## Flow

1. Welcome  
2. Favorite movies (TMDB search, debounced)  
3. Genres (TMDB `/genre/movie/list`)  
4. Filmmakers (TMDB person search, optional)  
5. Languages + discovery preferences  
6. Review → save  

## APIs

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/onboarding/search?q=&type=movie\|person` | GET | Debounced TMDB search |
| `/api/onboarding/genres` | GET | TMDB genre list |
| `/api/onboarding/state` | GET/POST | Load/save draft |
| `/api/onboarding/complete` | POST | Validate, persist, taste signals |

## Persistence

- **Guest:** `localStorage` key `ff.onboarding.draft` + device user via `ff_device_id`
- **Signed in:** `user_preferences.settings_json.onboarding` + sync on save
- **Complete:** `user_favorites`, `users.favorite_*_json`, `taste_signals`, `taste_snapshots`

## Personalization

On complete, `applyOnboardingToUser` writes taste signals (`favorite_movie`, `genre`, `person`, `language`) consumed by `/api/tonight`, `/api/ai/taste`, and recommendations.

## Analytics

`onboarding_started`, `onboarding_movie_search`, `onboarding_movie_selected`, `onboarding_movie_removed`, `onboarding_genre_selected`, `onboarding_person_selected`, `onboarding_step_completed`, `onboarding_completed`, `onboarding_save_failed`

## Version

`ONBOARDING_VERSION = 2`
