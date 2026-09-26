export function PosterSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="row-scroller">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="movie-card">
          <div className="aspect-[2/3] skeleton rounded-[var(--radius-md)]" />
          <div className="mt-2 h-3 w-3/4 skeleton rounded" />
        </div>
      ))}
    </div>
  );
}

export function PageError({ message = "Something went wrong. Movie data is temporarily unavailable." }: { message?: string }) {
  return (
    <div className="empty-state">
      <p className="empty-state__title">We couldn&apos;t load this</p>
      <p className="empty-state__body">{message}</p>
      <a href="/" className="btn btn-secondary mt-8">Return home</a>
    </div>
  );
}

export function EmptyState({
  title,
  body,
  href,
  action,
}: {
  title: string;
  body: string;
  href: string;
  action: string;
}) {
  return (
    <div className="empty-state">
      <h1 className="empty-state__title">{title}</h1>
      <p className="empty-state__body">{body}</p>
      <a href={href} className="btn btn-primary mt-8">{action}</a>
    </div>
  );
}
