import { describe, expect, it } from "vitest";
import type { MovieSummary } from "@/lib/tmdb/types";
import { layoutSolarSystem, planetAngle, planetRingSizes } from "./solar-system";

const stub = (id: number) => ({ id, title: `M${id}` }) as MovieSummary;

describe("solar system catalog layout", () => {
  it("keeps a single title as the sun", () => {
    const layout = layoutSolarSystem([stub(1)]);
    expect(layout.sun?.id).toBe(1);
    expect(layout.rings).toEqual([]);
  });

  it("puts the first catalog title at the center unless another title is focused", () => {
    const movies = [1, 2, 3, 4, 5].map(stub);
    expect(layoutSolarSystem(movies).sun?.id).toBe(1);
    expect(layoutSolarSystem(movies, 4).sun?.id).toBe(4);
    expect(layoutSolarSystem(movies, 4).rings.flatMap((ring) => ring.planets).map((m) => m.id)).toEqual([1, 2, 3, 5]);
  });

  it("fills inner rings first and preserves remaining catalog order", () => {
    expect(planetRingSizes(19)).toEqual([3, 5, 6, 5]);
    expect(planetRingSizes(40)).toEqual([3, 5, 6, 8, 10, 8]);
    const movies = Array.from({ length: 20 }, (_, i) => stub(i + 1));
    const layout = layoutSolarSystem(movies);
    expect(layout.sun?.id).toBe(1);
    expect(layout.rings.map((ring) => ring.planets.length)).toEqual([3, 5, 6, 5]);
    expect(layout.rings.flatMap((ring) => ring.planets).map((m) => m.id)).toEqual(
      Array.from({ length: 19 }, (_, i) => i + 2),
    );
  });

  it("spaces planets evenly on a ring", () => {
    expect(planetAngle(0, 4, 24)).toBe(24);
    expect(planetAngle(1, 4, 24)).toBe(114);
    expect(planetAngle(0, 0, 10)).toBe(10);
  });
});
