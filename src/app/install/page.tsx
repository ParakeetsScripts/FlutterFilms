import { SITE_FULL_NAME, SITE_NAME } from "@/lib/brand";
import Link from "next/link";

export const metadata = {
  title: `Install ${SITE_FULL_NAME}`,
  description: `Install ${SITE_FULL_NAME} as a Progressive Web App on your device.`,
};

export default function InstallPage() {
  return (
    <div className="page-container page-section max-w-2xl">
      <header className="page-header">
        <p className="eyebrow">Install</p>
        <h1 className="page-header__title">Add {SITE_FULL_NAME} to your device</h1>
        <p className="page-header__subtitle">
          Install the PWA for faster access. {SITE_NAME} does not host movies — offline mode caches only the app shell and safe pages.
        </p>
      </header>
      <div className="space-y-6">
        <section className="ai-usage-card">
          <h2 className="font-medium">iPhone / iPad (Safari)</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-[var(--text-secondary)]">
            <li>Open flutterfilms.app in Safari</li>
            <li>Tap Share → Add to Home Screen</li>
            <li>Launch from your home screen</li>
          </ol>
        </section>
        <section className="ai-usage-card">
          <h2 className="font-medium">Android (Chrome)</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-[var(--text-secondary)]">
            <li>Open the site in Chrome</li>
            <li>Tap the menu → Install app or Add to Home screen</li>
          </ol>
        </section>
        <section className="ai-usage-card">
          <h2 className="font-medium">Desktop (Chrome / Edge)</h2>
          <p className="mt-3 text-sm text-[var(--text-secondary)]">
            Look for the install icon in the address bar, or use the browser menu → Install {SITE_NAME}.
          </p>
        </section>
        <Link href="/" className="btn btn-primary">Back to home</Link>
      </div>
    </div>
  );
}
