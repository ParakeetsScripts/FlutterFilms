import { describe, expect, it } from "vitest";
import { buildOllamaDynamicModels, inferModelMeta, slugifyOllamaModelId } from "./dynamic-models";

describe("dynamic Ollama models", () => {
  it("creates connected models for unknown Ollama tags", () => {
    const installed = new Map([["qwen3-coder:30b", { size: 18_000_000_000 }]]);
    const models = buildOllamaDynamicModels(installed, new Set(), new Date().toISOString());
    expect(models).toHaveLength(1);
    expect(models[0].apiModelId).toBe("qwen3-coder:30b");
    expect(models[0].healthStatus).toBe("connected");
    expect(models[0].category).toBe("coding");
  });

  it("skips tags already in registry", () => {
    const installed = new Map([["qwen3-coder:30b", { size: 1 }]]);
    const models = buildOllamaDynamicModels(installed, new Set(["qwen3-coder:30b"]), new Date().toISOString());
    expect(models).toHaveLength(0);
  });

  it("infers coding category from name", () => {
    expect(inferModelMeta("qwen2.5-coder:7b").category).toBe("coding");
  });

  it("slugifies model ids", () => {
    expect(slugifyOllamaModelId("qwen3-coder:30b")).toBe("ollama-qwen3-coder-30b");
  });
});
