import { formatVote } from "@/lib/slug";

function formatVotes(count: number | null | undefined): string | null {
  if (!count) return null;
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M votes`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K votes`;
  return `${count.toLocaleString()} votes`;
}

export function RatingBadge({
  source,
  rating,
  voteCount,
  variant = "inline",
}: {
  source: "TMDB" | "IMDb";
  rating: number | null | undefined;
  voteCount?: number | null;
  variant?: "inline" | "stacked";
}) {
  const formatted = formatVote(rating ?? null);
  if (!formatted) return null;
  const votes = formatVotes(voteCount);

  if (variant === "stacked") {
    return (
      <div className="rating-stacked">
        <span className="rating-stacked__source">{source}</span>
        <span className="rating-stacked__value">{formatted}</span>
        {votes ? <span className="rating-stacked__votes">{votes}</span> : null}
      </div>
    );
  }

  return (
    <span className="rating-badge">
      <span className="rating-badge__source">{source}</span>
      <span className="rating-badge__value">{formatted}</span>
      {votes ? <span className="text-[var(--text-muted)]">({votes.replace(" votes", "")})</span> : null}
    </span>
  );
}
