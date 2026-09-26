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
import {
  getInstallCapability,
  uninstallInstructionsFor,
  type InstallMethod,
} from "@/lib/pwa/platform";
import { getCanonicalSiteLabel, getCanonicalSiteUrl } from "@/lib/site-url";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const PLATFORMS: Array<{ id: InstallPlatform | "ios" | "ipad"; label: string }> = [
  { id: "ios", label: "iPhone" },
  { id: "ipad", label: "iPad" },
  { id: "android", label: "Android" },
  { id: "mac", label: "Mac" },
  { id: "windows", label: "Windows" },
  { id: "linux", label: "Linux / ChromeOS" },
];

function instructionsFor(platform: InstallPlatform, siteLabel: string, siteUrl: string): string[] {
  switch (platform) {
    case "ios":
    case "ipad":
      return [
        `Open ${SITE_NAME} in Safari at ${siteLabel}.`,
        "Tap the Share button.",
        "Choose Add to Home Screen.",
        "Confirm the name FlutterFilms.",
        "Tap Add.",
        "iOS does not expose an automatic Install button in every browser — manual Add to Home Screen is the supported path.",
      ];
    case "android":
      return [
        `Open ${SITE_NAME} in Chrome or a compatible browser at ${siteLabel}.`,
        "Open the browser menu (⋮).",
        "Choose Install app or Add to Home screen (wording varies).",
        "Confirm installation.",
        "Some Android browsers only support manual shortcuts.",
      ];
    case "mac":
      return [
        `Open ${SITE_NAME} in Chrome or Edge at ${siteUrl}.`,
        "Look for the install icon in the address bar, or open the browser menu.",
        "Choose Install FlutterFilms.",
        "Safari on macOS may use File → Add to Dock or Share → Add to Dock depending on version.",
      ];
    case "windows":
      return [
        `Open ${SITE_NAME} in Chrome or Edge at ${siteUrl}.`,
        "Look for the install icon in the address bar.",
        "Or open the browser menu and choose Install FlutterFilms.",
      ];
    case "linux":
      return [
        `Open ${SITE_NAME} in Chrome or another Chromium browser at ${siteUrl}.`,
        "ChromeOS and Linux desktops may show Install in the address bar or app menu.",
        "If no install control appears, bookmark the site or pin the tab.",
      ];
    default:
      return [
        `Open ${SITE_NAME} at ${siteUrl}.`,
        "Your browser may support installing to the home screen, dock, or launcher.",
        "If installation is unavailable, continue using FlutterFilms in the browser.",
      ];
  }
}

function methodLabel(method: InstallMethod): string {
  if (method === "automatic") return "Automatic install available";
  if (method === "manual") return "Manual installation required";
  return "Browser install unavailable";
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
    q: "Is this in the App Store or Google Play?",
    a: "No. FlutterFilms installs as a Progressive Web App through your browser unless a future native wrapper is published separately.",
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
    const sync = () => {
      setInstallReady(Boolean(getDeferredInstallPrompt()));
      setStandalone(isStandalonePwa());
    };
    sync();
    window.addEventListener("ff-install-prompt-ready", sync);
    window.addEventListener("ff-pwa-installed", sync);
    return () => {
      window.removeEventListener("ff-install-prompt-ready", sync);
      window.removeEventListener("ff-pwa-installed", sync);
    };
  }, []);

  const resolvedPlatform = useMemo<InstallPlatform>(() => {
    if (platform !== "unknown") return platform;
    const detected = detectInstallPlatform();
    return detected === "unknown" ? "windows" : detected;
  }, [platform]);

  const capability = useMemo(
    () => getInstallCapability(installReady),
    [installReady, standalone, platform],
  );

  async function onInstallClick() {
    setInstallMessage(null);
    const outcome = await triggerInstallPrompt();
    if (outcome === "accepted") {
      setInstallMessage("FlutterFilms installation started in your browser.");
      track("pwa_installed", { source: "install_page" });
    } else if (outcome === "dismissed") {
      setInstallMessage("Install dismissed — use the manual steps below.");
    } else {
      setInstallMessage(capability.summary);
    }
  }

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

        <div className="mt-6 rounded-lg border border-[var(--border)] bg-[var(--surface-1)] px-4 py-3 text-sm">
          <p className="font-medium">{methodLabel(capability.method)}</p>
          <p className="mt-1 text-[var(--text-secondary)]">{capability.summary}</p>
          <p className="mt-2 text-xs text-[var(--text-muted)]">Detected: {capability.browserLabel}</p>
        </div>

        {standalone ? (
          <p className="mt-6 rounded-lg border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-4 py-3 text-sm">
            {SITE_NAME} is already installed on this device.
          </p>
        ) : (
          <div className="mt-6 flex flex-wrap gap-3">
            {installReady && capability.method === "automatic" ? (
              <button type="button" className="btn btn-primary" onClick={onInstallClick}>
                Install {SITE_NAME}
              </button>
            ) : null}
            <Link href="/" className="btn btn-secondary">Continue in browser</Link>
            <Link href="/install" className="btn btn-ghost">Refresh install status</Link>
          </div>
        )}
        {installMessage && <p className="mt-3 text-sm text-[var(--text-secondary)]">{installMessage}</p>}
      </ScrollReveal>

      <ScrollReveal>
        <h2 className="section-title">What works after installation</h2>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2 text-sm text-[var(--text-secondary)]">
          <li>• Faster access from your home screen or dock</li>
          <li>• App-like, full-screen browsing</li>
          <li>• Return to personalized discovery quickly</li>
          <li>• Cached app shell for quicker loads</li>
          <li>• Deep links open inside the installed app</li>
          <li>• Signed-in sessions behave like the browser</li>
        </ul>
        <p className="mt-4 text-sm text-[var(--text-muted)]">
          Does not include: offline movie playback, native App Store/Google Play distribution, or background video.
        </p>
      </ScrollReveal>

      <ScrollReveal>
        <h2 className="section-title">Choose your platform</h2>
        <div className="install-platform-tabs mt-4" role="tablist" aria-label="Install platform">
          {PLATFORMS.map((p) => (
            <button
              key={p.id}
              type="button"
              role="tab"
              id={`install-tab-${p.id}`}
              aria-selected={resolvedPlatform === p.id}
              aria-controls={`install-panel-${p.id}`}
              className={`filter-chip ${resolvedPlatform === p.id ? "is-active" : ""}`}
              onClick={() => setPlatform(p.id as InstallPlatform)}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div
          id={`install-panel-${resolvedPlatform}`}
          role="tabpanel"
          aria-labelledby={`install-tab-${resolvedPlatform}`}
          className="mt-6"
        >
          <ol className="list-decimal space-y-2 pl-5 text-sm text-[var(--text-secondary)]">
            {instructionsFor(resolvedPlatform, siteLabel, siteUrl).map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </div>
        <p className="mt-4 text-xs text-[var(--text-muted)]">
          Canonical URL: <a href={siteUrl} className="text-[var(--accent)] underline-offset-2 hover:underline">{siteUrl}</a>
        </p>
      </ScrollReveal>

      <ScrollReveal>
        <h2 className="section-title">Remove the installed app</h2>
        <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-[var(--text-secondary)]">
          {uninstallInstructionsFor(resolvedPlatform).map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
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
