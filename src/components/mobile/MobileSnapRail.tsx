import type { ReactNode } from "react";

/** Touch-friendly horizontal snap carousel for mobile rails. */
export function MobileSnapRail({
  children,
  variant = "posters",
  "aria-label": ariaLabel,
}: {
  children: ReactNode;
  variant?: "posters" | "default";
  "aria-label"?: string;
}) {
  return (
    <div
      className={`mobile-snap-rail ${variant === "posters" ? "mobile-snap-rail--posters" : ""}`}
      role="list"
      aria-label={ariaLabel}
    >
      {children}
    </div>
  );
}
