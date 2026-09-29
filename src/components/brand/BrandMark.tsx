const LOGO_SRC = "/brand/flutterfilms-logo.jpg";

export function BrandMark({
  size = 40,
  className = "",
  priority = false,
}: {
  size?: number;
  className?: string;
  priority?: boolean;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={LOGO_SRC}
      alt="FlutterFilms"
      width={size}
      height={size}
      className={className}
      decoding="async"
      loading={priority ? "eager" : "lazy"}
    />
  );
}

export const BRAND_LOGO_SRC = LOGO_SRC;
