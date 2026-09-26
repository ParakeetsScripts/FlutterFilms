import "server-only";

import {
  addAgentMemory as dbAddAgentMemory,
  deleteAgentMemory,
  listAgentMemories as dbListAgentMemories,
  type MemoryCategory,
} from "./repository";
import { getDatabase } from "@/lib/db/client";
import type { AgentMemory } from "@/lib/ai/intelligence/agent";

export type AgentMemoryRecord = {
  id: string;
  category: string;
  content: string;
  source: string;
  created_at: string;
};

export async function listAgentMemories(userId: string, category?: MemoryCategory) {
  return dbListAgentMemories(userId, category) as Promise<AgentMemoryRecord[]>;
}

export async function addAgentMemory(
  userId: string,
  category: MemoryCategory,
  content: string,
  source: "user" | "ai" | "system",
) {
  return dbAddAgentMemory(userId, category, content, source);
}

export async function removeAgentMemory(userId: string, memoryId: string) {
  return deleteAgentMemory(userId, memoryId);
}

export async function clearAgentMemories(userId: string) {
  const db = await getDatabase();
  const now = new Date().toISOString();
  await db.run("UPDATE agent_memories SET deleted_at = ? WHERE user_id = ? AND deleted_at IS NULL", [
    now,
    userId,
  ]);
}

export function memoriesToAgentShape(records: AgentMemoryRecord[]): Partial<AgentMemory> {
  const memory: Partial<AgentMemory> = {
    goals: [],
    dislikes: [],
    favoriteFilmmakers: [],
    unfinishedLists: [],
    notes: [],
  };
  for (const row of records) {
    if (row.category === "dislikes") memory.dislikes?.push(row.content);
    else if (row.category === "preferences") memory.goals?.push(row.content);
    else if (row.category === "watching_habits") memory.notes?.push(row.content);
    else memory.notes?.push(row.content);
  }
  return memory;
}
