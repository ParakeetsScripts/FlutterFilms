"use client";

import { usePwaInstall } from "@/hooks/use-pwa-install";
import { track } from "@/lib/analytics/track";
import { SITE_NAME } from "@/lib/brand";
import { getInstallCapability, manualInstallStepsFor } from "@/lib/pwa/platform";
import { detectInstallPlatform } from "@/lib/pwa/install-prompt";
import { getCanonicalSiteLabel, getCanonicalSiteUrl } from "@/lib/site-url";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type InstallButtonProps = {
  className?: string;
  size?: "default" | "lg";
  variant?: "default" | "header";
};

export function InstallButton({ className = "", size = "default", variant = "default" }: InstallButtonProps) {
  const { canInstall, showManualHint, standalone, install } = usePwaInstall();
  const [guideOpen, setGuideOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const capability = useMemo(() => getInstallCapability(canInstall), [canInstall]);
  const quickSteps = useMemo(() => {
    const platform = detectInstallPlatform();
    return manualInstallStepsFor(platform, capability.browserLabel, getCanonicalSiteLabel(), getCanonicalSiteUrl());
  }, [capability.browserLabel, canInstall]);

  if (!mounted) return null;
  if (standalone) return null;

  const sizeClass = size === "lg" ? "btn-lg" : "";
  const variantClass = variant === "header" ? "btn-header-install" : "btn-primary";

  async function onClick() {
    if (canInstall) {
      const accepted = await install();
      if (accepted) track("pwa_installed", { source: variant === "header" ? "header_install_button" : "home_install_button" });
      return;
    }
    if (showManualHint) {
      setGuideOpen(true);
      track("cta_clicked", { action: "install_manual_guide" });
      return;
    }
    track("cta_clicked", { action: "install_guide" });
    window.location.href = "/install";
  }

  return (
    <>
      <button
        type="button"
        className={`btn ${variantClass} install-button ${sizeClass} ${className}`.trim()}
        onClick={() => void onClick()}
        aria-haspopup={showManualHint ? "dialog" : undefined}
        title={showManualHint && !canInstall ? capability.summary : `Install ${SITE_NAME}`}
      >
        {variant === "header" ? "Install" : "Install app"}
      </button>

      {guideOpen ? (
        <div className="install-guide-modal" role="dialog" aria-modal="true" aria-labelledby="install-guide-title">
          <button type="button" className="install-guide-modal__backdrop" onClick={() => setGuideOpen(false)} aria-label="Close" />
          <div className="install-guide-modal__panel ai-usage-card">
            <p id="install-guide-title" className="font-medium">Install {SITE_NAME}</p>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">{capability.summary}</p>
            <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-[var(--text-secondary)]">
              {quickSteps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
            <div className="mt-5 flex flex-wrap gap-2">
              <button type="button" className="btn btn-primary" onClick={() => setGuideOpen(false)}>Got it</button>
              <Link href="/install" className="btn btn-ghost">Full install guide</Link>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
