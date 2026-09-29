"use client";

import { nativeShare } from "@/components/native/NativeBridge";
import { track } from "@/lib/analytics/track";
import { useState } from "react";

export function ShareActions({
  title,
  url,
  className = "flex flex-wrap gap-2",
  variant = "default",
}: {
  title: string;
  url: string;
  className?: string;
  variant?: "default" | "utility";
}) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    track("cta_clicked", { action: "copy_link", title });
    setTimeout(() => setCopied(false), 2000);
  }

  async function share() {
    track("cta_clicked", { action: "share", title });
    await nativeShare(title, url);
  }

  const buttonClass =
    variant === "utility" ? "btn btn-ghost text-sm detail-hero-v2__utility-btn" : "btn btn-ghost text-sm";

  return (
    <div className={className}>
      <button
        type="button"
        className={buttonClass}
        onClick={copyLink}
        data-testid="movie-copy-link"
        aria-label="Copy movie link"
      >
        {copied ? "Copied" : "Copy link"}
      </button>
      <button
        type="button"
        className={buttonClass}
        onClick={share}
        data-testid="movie-share"
        aria-label="Share movie"
      >
        Share
      </button>
    </div>
  );
}
