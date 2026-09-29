"use client";

import { usePwaInstall } from "@/hooks/use-pwa-install";
import { track } from "@/lib/analytics/track";
import { SITE_NAME } from "@/lib/brand";
import { getInstallCapability } from "@/lib/pwa/platform";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const DISMISS_KEY = "ff_install_dismissed";

export function InstallBanner() {
  const pathname = usePathname();
  const { canInstall, showManualHint, standalone, install } = usePwaInstall();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(DISMISS_KEY) === "1") {
      setDismissed(true);
    }
  }, []);

  if (pathname === "/install" || standalone || dismissed) return null;
  if (!canInstall && !showManualHint) return null;

  const capability = getInstallCapability(canInstall);

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  }

  async function installNow() {
    const accepted = await install();
    if (accepted) {
      track("pwa_installed", { source: "install_banner" });
    }
  }

  return (
    <aside className="install-banner" role="region" aria-label={`Install ${SITE_NAME}`}>
      <div className="install-banner__inner">
        <p className="install-banner__text">
          <strong>Install {SITE_NAME}</strong>
          <span className="install-banner__hint">{capability.summary}</span>
        </p>
        <div className="install-banner__actions">
          {canInstall ? (
            <button type="button" className="btn btn-primary text-sm" onClick={() => void installNow()}>
              Install
            </button>
          ) : (
            <Link
              href="/install"
              className="btn btn-primary text-sm"
              onClick={() => track("cta_clicked", { action: "install_cta" })}
            >
              View steps
            </Link>
          )}
          <button type="button" className="btn btn-ghost text-sm" onClick={dismiss}>
            Not now
          </button>
          <button type="button" className="install-banner__close" onClick={dismiss} aria-label="Close">
            ×
          </button>
        </div>
      </div>
    </aside>
  );
}
