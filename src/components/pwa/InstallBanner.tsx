"use client";

import { track } from "@/lib/analytics/track";
import { SITE_FULL_NAME, SITE_NAME } from "@/lib/brand";
import Link from "next/link";
import { useEffect, useState } from "react";

const DISMISS_KEY = "ff_install_dismissed";

export function InstallBanner() {
  const [show, setShow] = useState(false);
  const [standalone, setStandalone] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(DISMISS_KEY);
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    setStandalone(isStandalone);
    if (!dismissed && !isStandalone) setShow(true);
  }, []);

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, "1");
    setShow(false);
  }

  if (!show || standalone) return null;

  return (
    <aside className="install-banner" role="region" aria-label={`Install ${SITE_FULL_NAME}`}>
      <div className="install-banner__inner">
        <p className="install-banner__text">
          <strong>Get {SITE_NAME}</strong>
          <span className="install-banner__hint">Install for faster access</span>
        </p>
        <div className="install-banner__actions">
          <Link
            href="/install"
            className="btn btn-primary text-sm"
            onClick={() => track("cta_clicked", { action: "install_cta" })}
          >
            Install
          </Link>
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
