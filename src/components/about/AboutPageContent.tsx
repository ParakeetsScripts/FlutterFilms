"use client";

import { AboutFeatureCatalog, type AboutFeature } from "@/components/about/AboutFeatureCatalog";
import { ScrollReveal } from "@/components/scrollytelling/ScrollReveal";
import { SITE_NAME } from "@/lib/brand";
import Link from "next/link";

const STEPS = [
  { n: "01", title: "Discover", body: "Search and browse a catalog backed by TMDB metadata and IMDb ratings." },
  { n: "02", title: "Understand", body: "Movie briefings, comparisons, and intelligence features use source-backed evidence." },
  { n: "03", title: "Personalize", body: "Favorites, watch history, watchlists, and taste signals shape your experience." },
  { n: "04", title: "Decide", body: "Tonight, recommendations, and Cinema Agent help you choose what to watch next." },
  { n: "05", title: "Explore", body: "People, franchises, rooms, and shared lists extend discovery beyond a single title." },
];

const FEATURES = [
  { title: "Movie discovery", href: "/movies", desc: "Browse, search, and filter the catalog." },
  { title: "FlutterAI", href: "/flutter-ai", desc: "Source-grounded movie intelligence with tools and evidence." },
  { title: "Personal taste", href: "/my-cinema", desc: "Taste DNA, favorites, and your cinema profile." },
  { title: "Tonight", href: "/tonight", desc: "Constraint-aware picks for right now." },
  { title: "Smart Catalog Search", href: "/intelligence", desc: "Metadata and catalog intelligence — not vector embeddings." },
  { title: "Watchlists", href: "/watchlists", desc: "Personal and shared lists." },
  { title: "Movie rooms", href: "/rooms", desc: "Group decision rooms with real votes." },
  { title: "Intelligence hub", href: "/intelligence", desc: "Verified live and beta capabilities." },
  { title: "People & franchises", href: "/people", desc: "Filmmakers, cast, and collections." },
];

export function AboutPageContent({ features }: { features: AboutFeature[] }) {
  return (
    <div className="about-page space-y-16 pb-16">
      <ScrollReveal className="about-hero glass-surface glass-surface--card" as="div">
        <p className="mt-4 max-w-3xl text-[var(--text-secondary)] leading-relaxed">
          {SITE_NAME} combines real movie metadata, personalized discovery, and AI-powered movie intelligence to help
          you decide what to watch and explore what comes next.
        </p>
      </ScrollReveal>

      <ScrollReveal>
        <h2 className="section-title">Why {SITE_NAME} exists</h2>
        <p className="mt-3 max-w-3xl text-[var(--text-secondary)] leading-relaxed">
          Most movie tools answer <em>What is this movie?</em> {SITE_NAME} helps answer{" "}
          <em>What should I watch?</em>, <em>Why might I like it?</em>, and <em>What should I explore next?</em> — using
          verified catalog data, your taste, and clearly labeled AI interpretation.
        </p>
      </ScrollReveal>

      <ScrollReveal>
        <h2 className="section-title">How {SITE_NAME} works</h2>
        <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {STEPS.map((step) => (
            <li key={step.n} className="ai-usage-card">
              <p className="text-sm tracking-widest text-[var(--accent)]">{step.n}</p>
              <h3 className="mt-2 font-medium">{step.title}</h3>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">{step.body}</p>
            </li>
          ))}
        </ol>
      </ScrollReveal>

      <ScrollReveal>
        <h2 className="section-title">Where the movie data comes from</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <article className="ai-usage-card">
            <h3 className="font-medium">TMDB</h3>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              TMDB provides movie metadata and imagery used by {SITE_NAME}.
            </p>
          </article>
          <article className="ai-usage-card">
            <h3 className="font-medium">IMDb</h3>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              IMDb contributes structured rating data through official datasets imported by the application.
            </p>
          </article>
          <article className="ai-usage-card">
            <h3 className="font-medium">{SITE_NAME}</h3>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              {SITE_NAME} combines source data with your activity and preferences to personalize discovery.
            </p>
          </article>
          <article className="ai-usage-card">
            <h3 className="font-medium">Watch availability</h3>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              When available, watch-provider information is surfaced from authorized provider data — not invented by AI.
            </p>
          </article>
        </div>
        <p className="mt-4 text-sm text-[var(--text-muted)]">
          This product uses the TMDB API but is not endorsed or certified by TMDB.
        </p>
      </ScrollReveal>

      <ScrollReveal>
        <h2 className="section-title">Playback</h2>
        <p className="mt-3 max-w-3xl text-[var(--text-secondary)]">
          {SITE_NAME} does not host films. Playback is limited to authorized sources, including official trailers, legal
          deep links, or media you already own.
        </p>
      </ScrollReveal>

      <ScrollReveal>
        <h2 className="section-title">Data freshness</h2>
        <p className="mt-3 max-w-3xl text-[var(--text-secondary)]">
          Movie metadata is synchronized on a schedule so supported information can stay current without requiring a new
          application deployment. Different data types may refresh at different intervals.
        </p>
      </ScrollReveal>

      <ScrollReveal>
        <h2 className="section-title">AI with evidence</h2>
        <p className="mt-3 max-w-3xl text-[var(--text-secondary)]">
          {SITE_NAME} retrieves relevant movie evidence → TMDB / IMDb / {SITE_NAME} user signals → Cinema Agent → AI
          interpretation. Verified movie data and AI interpretation are treated differently.
        </p>
      </ScrollReveal>

      <ScrollReveal>
        <h2 className="section-title">Trust</h2>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2 text-[var(--text-secondary)]">
          <li>Real data from catalog sources</li>
          <li>Real preferences from your library</li>
          <li>Real actions with server confirmation</li>
          <li>Honest limitations when data is missing</li>
        </ul>
      </ScrollReveal>

      <ScrollReveal>
        <h2 className="section-title">Privacy</h2>
        <p className="mt-3 max-w-3xl text-[var(--text-secondary)]">
          Personalization uses your account data, taste signals, and optional Cinema Agent memory — with controls to
          pause learning, reset taste, and delete memories.{" "}
          <Link href="/account/privacy" className="text-[var(--accent)] underline-offset-2 hover:underline">
            Privacy center
          </Link>
        </p>
      </ScrollReveal>

      <ScrollReveal>
        <h2 className="section-title">Open models</h2>
        <p className="mt-3 max-w-3xl text-[var(--text-secondary)]">
          Configure Ollama or OpenAI-compatible endpoints for local inference, or cloud OpenAI when available. Provider
          status reflects actual reachability — not registry placeholders.{" "}
          <Link href="/open-models" className="text-[var(--accent)] underline-offset-2 hover:underline">
            Open Models
          </Link>
        </p>
      </ScrollReveal>

      <ScrollReveal>
        <h2 className="section-title">Explore capabilities</h2>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <Link key={f.title} href={f.href} className="ai-usage-card block transition hover:border-[var(--accent)]">
              <h3 className="font-medium">{f.title}</h3>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">{f.desc}</p>
            </Link>
          ))}
        </div>
      </ScrollReveal>

      <ScrollReveal>
        <AboutFeatureCatalog features={features} />
      </ScrollReveal>

      <ScrollReveal className="about-cta ai-usage-card text-center">
        <h2 className="section-title">Ready to discover differently?</h2>
        <p className="mt-2 text-[var(--text-secondary)]">Start exploring with verified data and your taste.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/movies" className="btn btn-primary">Explore movies</Link>
          <Link href="/flutter-ai" className="btn btn-secondary">Ask FlutterAI</Link>
          <Link href="/install" className="btn btn-ghost">Install {SITE_NAME}</Link>
        </div>
        <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm">
          <Link href="/sources" className="text-[var(--accent)]">Sources</Link>
          <Link href="/settings" className="text-[var(--accent)]">Settings</Link>
        </div>
      </ScrollReveal>
    </div>
  );
}
