"use client";

import { track } from "@/lib/analytics/track";
import { SITE_NAME } from "@/lib/brand";
import {
  getDeferredInstallPrompt,
  isStandalonePwa,
  triggerInstallPrompt,
} from "@/lib/pwa/install-prompt";
import { getInstallCapability } from "@/lib/pwa/platform";
import Link from "next/link";
import { useEffect, useState } from "react";

const DISMISS_KEY = "ff_install_dismissed";

export function InstallBanner() {
  const [show, setShow] = useState(false);
  const [standalone, setStandalone] = useState(false);
  const [installReady, setInstallReady] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const dismissed = localStorage.getItem(DISMISS_KEY);
    const installed = isStandalonePwa();
    setStandalone(installed);
    setInstallReady(Boolean(getDeferredInstallPrompt()));
    if (!dismissed && !installed) setShow(true);

    const onPromptReady = () => setInstallReady(Boolean(getDeferredInstallPrompt()));
    const onInstalled = () => {
      setStandalone(true);
      setShow(false);
    };
    window.addEventListener("ff-install-prompt-ready", onPromptReady);
    window.addEventListener("ff-pwa-installed", onInstalled);
    return () => {
      window.removeEventListener("ff-install-prompt-ready", onPromptReady);
      window.removeEventListener("ff-pwa-installed", onInstalled);
    };
  }, []);

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, "1");
    setShow(false);
  }

  async function installNow() {
    setMessage(null);
    const outcome = await triggerInstallPrompt();
    if (outcome === "accepted") {
      setMessage("Installation started.");
      setShow(false);
      track("pwa_installed", { source: "install_banner" });
      return;
    }
    if (outcome === "dismissed") {
      setMessage("Install dismissed.");
      return;
    }
    const capability = getInstallCapability(false);
    setMessage(capability.summary);
  }

  if (!show || standalone) return null;

  const capability = getInstallCapability(installReady);

  return (
    <aside className="install-banner" role="region" aria-label={`Install ${SITE_NAME}`}>
      <div className="install-banner__inner">
        <p className="install-banner__text">
          <strong>Install {SITE_NAME}</strong>
          <span className="install-banner__hint">{capability.summary}</span>
        </p>
        <div className="install-banner__actions">
          {installReady ? (
            <button type="button" className="btn btn-primary text-sm" onClick={installNow}>
              Install
            </button>
          ) : (
            <Link
              href="/install"
              className="btn btn-primary text-sm"
              onClick={() => track("cta_clicked", { action: "install_cta" })}
            >
              Install guide
            </Link>
          )}
          <Link href="/" className="btn btn-ghost text-sm">Continue in browser</Link>
          <button type="button" className="btn btn-ghost text-sm" onClick={dismiss}>
            Not now
          </button>
          <button type="button" className="install-banner__close" onClick={dismiss} aria-label="Close">
            ×
          </button>
        </div>
        {message ? <p className="install-banner__feedback text-xs text-[var(--text-muted)]">{message}</p> : null}
      </div>
    </aside>
  );
}
