import { handleApi } from "@/lib/api";
import { buildWeeklyBrief } from "@/lib/ai/intelligence/weekly-brief";

export const revalidate = 3600;

export async function GET() {
  return handleApi(() => buildWeeklyBrief());
}
