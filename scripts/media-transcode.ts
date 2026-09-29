import { processTranscodeQueue } from "../src/lib/media/transcode";

async function main() {
  const limit = Number(process.argv[2]) || 5;
  const processed = await processTranscodeQueue(limit);
  console.log(`Processed ${processed} transcode job(s).`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
