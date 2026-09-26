"use client";

import { ScrollReveal } from "@/components/scrollytelling/ScrollReveal";
import { track } from "@/lib/analytics/track";
import { SITE_NAME } from "@/lib/brand";
import {
  detectInstallPlatform,
  getDeferredInstallPrompt,
  isStandalonePwa,
  triggerInstallPrompt,
  type InstallPlatform,
} from "@/lib/pwa/install-prompt";
import { getCanonicalSiteLabel, getCanonicalSiteUrl } from "@/lib/site-url";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const PLATFORMS: Array<{ id: InstallPlatform | "ios" | "ipad"; label: string }> = [
  { id: "ios", label: "iPhone" },
  { id: "ipad", label: "iPad" },
  { id: "android", label: "Android" },
  { id: "mac", label: "Mac" },
  { id: "windows", label: "Windows" },
  { id: "linux", label: "Linux" },
];

function instructionsFor(platform: InstallPlatform, siteLabel: string, siteUrl: string): string[] {
  switch (platform) {
    case "ios":
    case "ipad":
      return [
        `Open ${SITE_NAME} in Safari at ${siteLabel}.`,
        "Tap Share.",
        "Choose Add to Home Screen.",
        "Confirm the app name.",
        "Tap Add.",
      ];
    case "android":
      return [
        `Open ${SITE_NAME} at ${siteLabel}.`,
        "Open the browser menu.",
        "Choose Install app or Add to Home screen.",
        "Confirm installation.",
        "Menu wording can vary by browser and device.",
      ];
    case "mac":
      return [
        `Open ${SITE_NAME} in Safari or Chrome at ${siteUrl}.`,
        "In Chrome or Edge, look for the install icon in the address bar.",
        "Or open the browser menu and choose Install.",
        "Safari on macOS uses File → Add to Dock or Share → Add to Dock depending on version.",
      ];
    case "windows":
      return [
        `Open ${SITE_NAME} in Chrome or Edge at ${siteUrl}.`,
        "Look for the install icon in the address bar.",
        "Or open the browser menu.",
        `Choose Install ${SITE_NAME}.`,
      ];
    case "linux":
      return [
        `Open ${SITE_NAME} in a Chromium-based browser at ${siteUrl}.`,
        "Your browser may support installing to the application launcher or home screen.",
        "Look for Install in the address bar or browser menu.",
      ];
    default:
      return [
        `Open ${SITE_NAME} at ${siteUrl}.`,
        "Your browser may support adding the app to your home screen, dock, or launcher.",
      ];
  }
}

const FAQ = [
  {
    q: "Does installing FlutterFilms download movies?",
    a: "No. Installation adds the web app shell only.",
  },
  {
    q: "Can I watch movies offline?",
    a: "No. Offline support is limited to the app shell and safe cached pages. FlutterFilms does not provide offline movie streaming.",
  },
  {
    q: "Does installation create an App Store app?",
    a: "No. This is a web app (PWA) installation in your browser.",
  },
  {
    q: "Can I uninstall it?",
    a: "Yes — remove it like any other installed web app or home-screen shortcut on your platform.",
  },
];

export function InstallHub() {
  const [platform, setPlatform] = useState<InstallPlatform>("unknown");
  const [standalone, setStandalone] = useState(false);
  const [installReady, setInstallReady] = useState(false);
  const [installMessage, setInstallMessage] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const siteUrl = useMemo(() => getCanonicalSiteUrl(), []);
  const siteLabel = useMemo(() => getCanonicalSiteLabel(), []);

  useEffect(() => {
    setPlatform(detectInstallPlatform());
    setStandalone(isStandalonePwa());
    const check = () => setInstallReady(Boolean(getDeferredInstallPrompt()));
    check();
    window.addEventListener("ff-install-prompt-ready", check);
    return () => window.removeEventListener("ff-install-prompt-ready", check);
  }, []);

  async function onInstallClick() {
    setInstallMessage(null);
    const outcome = await triggerInstallPrompt();
    if (outcome === "accepted") {
      setInstallMessage(`${SITE_NAME} installation started.`);
      track("pwa_installed", { source: "install_page" });
    } else if (outcome === "dismissed") {
      setInstallMessage("Install dismissed — use the manual steps below.");
    } else {
      setInstallMessage("Your browser does not expose an install prompt here. Follow the manual steps below.");
    }
  }

  const displayPlatform = platform === "unknown" ? "windows" : platform;

  return (
    <div className="install-page space-y-12 pb-16">
      <ScrollReveal className="ai-usage-card">
        <p className="eyebrow">Install</p>
        <h1 className="page-header__title mt-2">Install {SITE_NAME}</h1>
        <p className="mt-3 text-xl font-serif text-[var(--text-primary)]">Keep your cinema one tap away.</p>
        <p className="mt-4 max-w-2xl text-[var(--text-secondary)]">
          Install {SITE_NAME} as a web app for faster access and a more app-like experience. Offline support is limited
          to the application shell and safe cached pages — {SITE_NAME} does not provide offline movie streaming.
        </p>

        {standalone ? (
          <p className="mt-6 rounded-lg border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-4 py-3 text-sm">
            {SITE_NAME} is already installed on this device.
          </p>
        ) : (
          <div className="mt-6 flex flex-wrap gap-3">
            {installReady && (
              <button type="button" className="btn btn-primary" onClick={onInstallClick}>
                Install {SITE_NAME}
              </button>
            )}
            <Link href="/" className="btn btn-secondary">Open {SITE_NAME}</Link>
          </div>
        )}
        {installMessage && <p className="mt-3 text-sm text-[var(--text-secondary)]">{installMessage}</p>}
      </ScrollReveal>

      <ScrollReveal>
        <h2 className="section-title">Why install {SITE_NAME}?</h2>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2 text-sm text-[var(--text-secondary)]">
          <li>• Faster access from your home screen or dock</li>
          <li>• App-like, full-screen browsing</li>
          <li>• Easy return to personalized discovery</li>
          <li>• Cached app shell for quicker loads</li>
        </ul>
      </ScrollReveal>

      <ScrollReveal>
        <h2 className="section-title">Choose your platform</h2>
        <div className="mt-4 flex flex-wrap gap-2" role="tablist" aria-label="Install platform">
          {PLATFORMS.map((p) => (
            <button
              key={p.id}
              type="button"
              role="tab"
              aria-selected={displayPlatform === p.id}
              className={`filter-chip ${displayPlatform === p.id ? "is-active" : ""}`}
              onClick={() => setPlatform(p.id as InstallPlatform)}
            >
              {p.label}
            </button>
          ))}
        </div>
        <ol className="mt-6 list-decimal space-y-2 pl-5 text-sm text-[var(--text-secondary)]">
          {instructionsFor(displayPlatform, siteLabel, siteUrl).map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <p className="mt-4 text-xs text-[var(--text-muted)]">
          Canonical URL: <a href={siteUrl} className="text-[var(--accent)] underline-offset-2 hover:underline">{siteUrl}</a>
        </p>
      </ScrollReveal>

      <ScrollReveal>
        <h2 className="section-title">FAQ</h2>
        <div className="mt-4 space-y-2">
          {FAQ.map((item, i) => (
            <div key={item.q} className="ai-usage-card">
              <button
                type="button"
                className="flex w-full items-center justify-between text-left font-medium"
                aria-expanded={openFaq === i}
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
              >
                {item.q}
                <span aria-hidden>{openFaq === i ? "−" : "+"}</span>
              </button>
              {openFaq === i && <p className="mt-3 text-sm text-[var(--text-secondary)]">{item.a}</p>}
            </div>
          ))}
        </div>
      </ScrollReveal>

      <ScrollReveal>
        <p className="text-sm text-[var(--text-muted)]">
          Installation does not grant {SITE_NAME} access to unrelated files, other apps, or private device data beyond
          normal web app storage.
        </p>
        <Link href="/about" className="btn btn-ghost mt-4">About {SITE_NAME}</Link>
      </ScrollReveal>
    </div>
  );
}
