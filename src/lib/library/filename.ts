export type ParsedFilename = {
  raw: string;
  title: string | null;
  year: number | null;
  imdbId: string | null;
  tmdbId: number | null;
};

const VIDEO_EXT = /\.(mkv|mp4|avi|mov|m4v|wmv|ts|m2ts)$/i;
const JUNK = /\b(1080p|720p|2160p|4k|bluray|webrip|web-dl|hdr|x264|x265|hevc|aac|dts|truehd|extended|unrated|remux|proper)\b/gi;

export function parseMediaFilename(input: string): ParsedFilename {
  const raw = input.trim();
  const base = raw.split(/[/\\]/).pop() ?? raw;
  const withoutExt = base.replace(VIDEO_EXT, "");

  const imdbMatch = raw.match(/\b(tt\d{7,8})\b/i);
  const tmdbMatch = raw.match(/\btmdb[\/_-]?(\d+)\b/i);
  const yearMatch = withoutExt.match(/(?:^|[. _\-(])((?:19|20)\d{2})(?:[. _\-)]|$)/);

  let title = withoutExt
    .replace(/\btt\d{7,8}\b/gi, " ")
    .replace(/\btmdb[\/_-]?\d+\b/gi, " ")
    .replace(/[._]+/g, " ")
    .replace(/[[\](){}]/g, " ")
    .replace(JUNK, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (yearMatch) {
    title = title.replace(yearMatch[1], " ").replace(/\s+/g, " ").trim();
  }

  return {
    raw,
    title: title || null,
    year: yearMatch ? Number(yearMatch[1]) : null,
    imdbId: imdbMatch ? imdbMatch[1].toLowerCase() : null,
    tmdbId: tmdbMatch ? Number(tmdbMatch[1]) : null,
  };
}
