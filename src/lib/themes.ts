export type AppTheme =
  | "noir"
  | "charcoal"
  | "velvet"
  | "dawn"
  | "midnight"
  | "ember"
  | "forest"
  | "ocean"
  | "rose"
  | "slate"
  | "amber"
  | "eclipse"
  | "frost"
  | "neon";

export const THEMES: Array<{ id: AppTheme; label: string; description: string }> = [
  { id: "noir", label: "Noir", description: "Neutral cinematic dark" },
  { id: "charcoal", label: "Charcoal", description: "Cool graphite tones" },
  { id: "velvet", label: "Velvet", description: "Warm theater charcoal" },
  { id: "dawn", label: "Dawn", description: "Editorial light mode" },
  { id: "midnight", label: "Midnight", description: "Deep blue night" },
  { id: "ember", label: "Ember", description: "Warm crimson glow" },
  { id: "forest", label: "Forest", description: "Moss and pine" },
  { id: "ocean", label: "Ocean", description: "Teal horizon" },
  { id: "rose", label: "Rose", description: "Soft mauve dusk" },
  { id: "slate", label: "Slate", description: "Cool steel" },
  { id: "amber", label: "Amber", description: "Golden hour" },
  { id: "eclipse", label: "Eclipse", description: "Violet twilight" },
  { id: "frost", label: "Frost", description: "Icy daylight" },
  { id: "neon", label: "Neon", description: "Cyber green pulse" },
];

export function isAppTheme(value: string): value is AppTheme {
  return THEMES.some((theme) => theme.id === value);
}

export function migrateTheme(value: string): AppTheme {
  if (isAppTheme(value)) return value;
  if (value === "obsidian" || value === "dark") return "noir";
  if (value === "cinema") return "velvet";
  if (value === "daylight") return "dawn";
  return "noir";
}
