"use client";

import { nativeShare } from "@/components/native/NativeBridge";
import { track } from "@/lib/analytics/track";
import { useState } from "react";

export function ShareActions({ title, url }: { title: string; url: string }) {
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

  return (
    <div className="flex flex-wrap gap-2">
      <button type="button" className="btn btn-ghost text-sm" onClick={copyLink}>
        {copied ? "Copied" : "Copy link"}
      </button>
      <button type="button" className="btn btn-ghost text-sm" onClick={share}>Share</button>
    </div>
  );
}
