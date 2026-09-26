import { handleApi } from "@/lib/api";
import { getGenreList } from "@/lib/tmdb/configuration";

export async function GET() {
  return handleApi(async () => {
    const data = await getGenreList();
    return { genres: data.genres.sort((a, b) => a.name.localeCompare(b.name)) };
  });
}
