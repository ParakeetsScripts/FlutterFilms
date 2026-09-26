import type { ReactNode } from "react";

type Width = "default" | "narrow" | "wide" | "full";

const WIDTH_CLASS: Record<Width, string> = {
  default: "responsive-container",
  narrow: "responsive-container responsive-container--narrow",
  wide: "responsive-container responsive-container--wide",
  full: "responsive-container responsive-container--full",
};

export function ResponsiveContainer({
  children,
  className = "",
  width = "default",
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  width?: Width;
  as?: "div" | "section" | "main" | "article";
}) {
  return <Tag className={`${WIDTH_CLASS[width]} ${className}`.trim()}>{children}</Tag>;
}
