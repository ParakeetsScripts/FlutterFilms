"use client";

import { useReducedMotion } from "@/hooks/useReducedMotion";
import { track } from "@/lib/analytics/track";
import { useEffect, useRef, useState, type ReactNode } from "react";

type ScrollRevealProps = {
  children: ReactNode;
  className?: string;
  sectionId?: string;
  as?: "section" | "div";
};

export function ScrollReveal({ children, className = "", sectionId, as = "section" }: ScrollRevealProps) {
  const ref = useRef<HTMLElement>(null);
  const reducedMotion = useReducedMotion();
  const [visible, setVisible] = useState(reducedMotion);
  const tracked = useRef(false);

  useEffect(() => {
    if (reducedMotion) {
      setVisible(true);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          if (sectionId && !tracked.current) {
            tracked.current = true;
            track("scrolly_section_view", { sectionId });
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [reducedMotion, sectionId]);

  const Tag = as;
  return (
    <Tag
      ref={ref as never}
      className={`scroll-reveal ${visible ? "scroll-reveal--visible" : ""} ${className}`.trim()}
      data-section={sectionId}
    >
      {children}
    </Tag>
  );
}
