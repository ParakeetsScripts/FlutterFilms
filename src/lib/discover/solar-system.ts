import type { MovieSummary } from "@/lib/tmdb/types";

/** Inner rings fill first. Capacities are a layout choice, not a ranking. */
const RING_CAPACITIES = [3, 5, 6, 8] as const;
const EXTRA_RING_CAPACITY = 10;
const MAX_RINGS = 8;

export type SolarRing = {
  index: number;
  radius: number;
  periodSec: number;
  offsetDeg: number;
  planets: MovieSummary[];
};

export type SolarSystemLayout = {
  sun: MovieSummary | null;
  rings: SolarRing[];
};

/** How many titles sit on each orbit for a given planet count (everything except the sun). */
export function planetRingSizes(planetCount: number): number[] {
  if (planetCount <= 0) return [];
  if (planetCount <= 4) return [planetCount];
  const sizes: number[] = [];
  let remaining = planetCount;
  let index = 0;
  while (remaining > 0 && index < MAX_RINGS) {
    const cap = index < RING_CAPACITIES.length ? RING_CAPACITIES[index] : EXTRA_RING_CAPACITY;
    const take = Math.min(cap, remaining);
    sizes.push(take);
    remaining -= take;
    index += 1;
  }
  if (remaining > 0 && sizes.length) sizes[sizes.length - 1] += remaining;
  return sizes;
}

/**
 * Arrange the loaded catalog page as a solar system.
 * Sun = first title in current sort order (or the focused title if it is in the set).
 * Rings follow the remaining order. This is a UI layout, not similarity or astronomy.
 */
export function layoutSolarSystem(movies: MovieSummary[], focusId: number | null = null): SolarSystemLayout {
  if (!movies.length) return { sun: null, rings: [] };

  const focusedIndex = focusId === null ? -1 : movies.findIndex((movie) => movie.id === focusId);
  const sun = focusedIndex > 0 ? movies[focusedIndex] : movies[0];
  const planets = movies.filter((movie) => movie.id !== sun.id);
  const sizes = planetRingSizes(planets.length);
  const rings: SolarRing[] = [];
  let cursor = 0;

  const ringCount = Math.max(sizes.length, 1);
  for (let index = 0; index < sizes.length; index++) {
    const count = sizes[index];
    rings.push({
      index,
      radius: 20 + ((index + 1) / ringCount) * 32,
      periodSec: 26 + index * 16,
      offsetDeg: index * 22,
      planets: planets.slice(cursor, cursor + count),
    });
    cursor += count;
  }

  return { sun, rings };
}

export function planetAngle(indexOnRing: number, ringSize: number, offsetDeg: number): number {
  if (ringSize <= 0) return offsetDeg;
  return offsetDeg + (indexOnRing / ringSize) * 360;
}
