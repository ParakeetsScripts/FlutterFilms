/** First-party analytics event names — production contract. */
export type AnalyticsEventName =
  | "session_started"
  | "session_start"
  | "page_viewed"
  | "page_view"
  | "signup_started"
  | "signup_completed"
  | "login_completed"
  | "movie_viewed"
  | "movie_completed"
  | "movie_abandoned"
  | "search_performed"
  | "movie_searched"
  | "ai_prompt_submitted"
  | "ai_response_completed"
  | "ai_response_received"
  | "agent_tool_called"
  | "cinema_agent_used"
  | "recommendation_shown"
  | "recommendation_clicked"
  | "recommendation_saved"
  | "recommendation_dismissed"
  | "watchlist_added"
  | "watchlist_removed"
  | "favorite_added"
  | "favorite_removed"
  | "rating_created"
  | "tonight_started"
  | "tonight_completed"
  | "tonight_picker_completed"
  | "remember_started"
  | "remember_completed"
  | "scene_memory_search"
  | "room_created"
  | "room_joined"
  | "room_left"
  | "room_vote"
  | "room_vote_created"
  | "room_vote_removed"
  | "room_preference_saved"
  | "room_movie_viewed"
  | "room_result_generated"
  | "room_completed"
  | "room_closed"
  | "shared_watchlist_created"
  | "shared_list_created"
  | "shared_watchlist_joined"
  | "shared_list_invited"
  | "shared_watchlist_movie_added"
  | "shared_list_movie_added"
  | "shared_list_movie_removed"
  | "shared_list_ai_used"
  | "taste_dna_viewed"
  | "taste_dna_updated"
  | "creative_generation_started"
  | "creative_generation_completed"
  | "image_generation_requested"
  | "video_generation_requested"
  | "feature_executed"
  | "user_activated"
  | "onboarding_started"
  | "onboarding_movie_search"
  | "onboarding_movie_selected"
  | "onboarding_movie_removed"
  | "onboarding_genre_selected"
  | "onboarding_person_selected"
  | "onboarding_step_completed"
  | "onboarding_completed"
  | "onboarding_save_failed"
  | "cta_clicked"
  | "install_prompt_shown"
  | "install_completed"
  | "pwa_installed"
  | "rail_arrow_left"
  | "rail_arrow_right"
  | "rail_swipe"
  | "rail_drag"
  | "rail_view"
  | "rail_end_reached"
  | "scrolly_section_view"
  | "scrolly_scene_view"
  | "scroll_to_top";

export type AnalyticsProperties = Record<string, string | number | boolean | null | undefined>;

export type AnalyticsEvent = {
  name: AnalyticsEventName;
  properties?: AnalyticsProperties;
  path?: string;
  feature?: string;
};

/** Normalize legacy event names to canonical production names. */
export const EVENT_ALIASES: Partial<Record<AnalyticsEventName, AnalyticsEventName>> = {
  session_start: "session_started",
  page_view: "page_viewed",
  movie_searched: "search_performed",
  ai_response_received: "ai_response_completed",
  tonight_picker_completed: "tonight_completed",
  scene_memory_search: "remember_completed",
  shared_list_created: "shared_watchlist_created",
  shared_list_movie_added: "shared_watchlist_movie_added",
  room_vote_created: "room_vote",
  room_result_generated: "room_completed",
  pwa_installed: "install_completed",
  image_generation_requested: "creative_generation_started",
  video_generation_requested: "creative_generation_started",
};

export function canonicalEventName(name: AnalyticsEventName): AnalyticsEventName {
  return EVENT_ALIASES[name] ?? name;
}
