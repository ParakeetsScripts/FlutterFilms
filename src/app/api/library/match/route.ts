import { handleApi } from "@/lib/api";
import { matchLocalFilename } from "@/lib/library/match";
import { ValidationError } from "@/lib/validation";

export async function POST(request: Request) {
  return handleApi(async () => {
    const body = (await request.json()) as { filename?: string };
    if (!body.filename) throw new ValidationError("Filename is required.");
    return matchLocalFilename(body.filename);
  });
}
