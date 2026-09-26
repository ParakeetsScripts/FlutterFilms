import { getSessionUser } from "@/lib/auth/session";
import {
  addAgentMemory,
  clearAgentMemories,
  listAgentMemories,
  removeAgentMemory,
} from "@/lib/user/agent-memory-service";
import { setTasteLearningPaused } from "@/lib/user/taste-repository";
import { NextResponse } from "next/server";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const memories = await listAgentMemories(user.id);
  return NextResponse.json({ memories });
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const body = (await request.json()) as { content?: string; category?: string };
  if (!body.content?.trim()) return NextResponse.json({ error: "content required" }, { status: 400 });
  const id = await addAgentMemory(
    user.id,
    (body.category as import("@/lib/user/repository").MemoryCategory) ?? "preferences",
    body.content.trim(),
    "user",
  );
  return NextResponse.json({ id, status: "success" });
}

export async function DELETE(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const body = (await request.json()) as { memoryId?: string; clearAll?: boolean; pauseLearning?: boolean };
  if (body.pauseLearning != null) {
    await setTasteLearningPaused(user.id, body.pauseLearning);
    return NextResponse.json({ status: "success", paused: body.pauseLearning });
  }
  if (body.clearAll) {
    await clearAgentMemories(user.id);
    return NextResponse.json({ status: "success", cleared: true });
  }
  if (!body.memoryId) return NextResponse.json({ error: "memoryId required" }, { status: 400 });
  await removeAgentMemory(user.id, body.memoryId);
  return NextResponse.json({ status: "success", deleted: body.memoryId });
}
