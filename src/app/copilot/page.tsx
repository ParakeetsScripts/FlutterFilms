import { redirect } from "next/navigation";

export default async function CopilotPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const next = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string") next.set(key, value);
    else if (Array.isArray(value)) value.forEach((v) => next.append(key, v));
  }
  const query = next.toString();
  redirect(query ? `/flutter-ai?${query}` : "/flutter-ai");
}
