import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";

type GlassTone = "subtle" | "card" | "elevated" | "nav" | "modal" | "interactive";

type GlassSurfaceProps<T extends ElementType = "div"> = {
  as?: T;
  tone?: GlassTone;
  interactive?: boolean;
  selected?: boolean;
  children: ReactNode;
  className?: string;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "className" | "children">;

const toneClass: Record<GlassTone, string> = {
  subtle: "glass-surface--subtle",
  card: "glass-surface--card",
  elevated: "glass-surface--elevated",
  nav: "glass-surface--nav",
  modal: "glass-surface--modal",
  interactive: "glass-surface--interactive",
};

export function GlassSurface<T extends ElementType = "div">({
  as,
  tone = "card",
  interactive = false,
  selected = false,
  children,
  className = "",
  ...rest
}: GlassSurfaceProps<T>) {
  const Tag = as ?? "div";
  const classes = [
    "glass-surface",
    toneClass[tone],
    interactive ? "glass-surface--interactive" : "",
    selected ? "is-selected" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Tag className={classes} {...rest}>
      {children}
    </Tag>
  );
}
