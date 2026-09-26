import type { AiCapabilities } from "./types";

export function caps(partial: Partial<AiCapabilities>): AiCapabilities {
  return {
    reasoning: false,
    vision: false,
    coding: false,
    tools: false,
    imageGen: false,
    videoGen: false,
    ...partial,
  };
}
