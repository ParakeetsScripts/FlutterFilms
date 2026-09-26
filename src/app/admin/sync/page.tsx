import { classifyFreshness, formatRelativeTime } from "@/lib/sync/freshness";
import { getRecentSyncJobs, getSourceHealth } from "@/lib/sync/repository";
import { SITE_NAME } from "@/lib/brand";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sync dashboard",
  description: `Metadata synchronization status for ${SITE_NAME}.`,
};

function statusColor(status: string) {
  if (status === "HEALTHY" || status === "SUCCESS") return "text-emerald-400";
  if (status === "FAILED") return "text-red-400";
  return "text-amber-300";
}

export default async function AdminSyncPage() {
  const health = await getSourceHealth();
  const jobs = (await getRecentSyncJobs(20)) as Array<Record<string, unknown>>;

  return (
    <div className="mx-auto max-w-5xl space-y-10 px-4 py-12">
      <header>
        <h1 className="font-serif text-5xl">Synchronization</h1>
        <p className="mt-3 text-[var(--muted)]">
          TMDB and IMDb metadata are synchronized on a schedule. Cron endpoints are secured with{" "}
          <code className="text-[var(--text)]">CRON_SECRET</code>.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        {health.length ? (
          health.map((row) => (
            <article key={row.source} className="rounded-lg border border-white/10 bg-white/5 p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-serif text-2xl uppercase">{row.source}</h2>
                <span className={`text-sm ${statusColor(row.status)}`}>{row.status}</span>
              </div>
              <dl className="mt-4 space-y-2 text-sm text-[var(--muted)]">
                <div className="flex justify-between gap-4">
                  <dt>Last success</dt>
                  <dd className="text-[var(--text)]">{formatRelativeTime(row.lastSuccessfulSync)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt>Freshness</dt>
                  <dd className="text-[var(--text)]">
                    {classifyFreshness(row.lastSuccessfulSync, row.source === "imdb" ? "imdb" : "tmdb")}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt>Records processed</dt>
                  <dd className="text-[var(--text)]">{row.recordsProcessed}</dd>
                </div>
              </dl>
            </article>
          ))
        ) : (
          <p className="text-[var(--muted)]">No sync health data yet.</p>
        )}
      </section>

      <section>
        <h2 className="font-serif text-3xl">Recent jobs</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-[var(--muted)]">
              <tr>
                <th className="py-2 pr-4">Source</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Scanned</th>
                <th className="py-2 pr-4">Updated</th>
                <th className="py-2 pr-4">Failed</th>
                <th className="py-2">Duration</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={String(job.id)} className="border-t border-white/10">
                  <td className="py-2 pr-4">{String(job.source)}</td>
                  <td className={`py-2 pr-4 ${statusColor(String(job.status))}`}>{String(job.status)}</td>
                  <td className="py-2 pr-4">{Number(job.records_scanned ?? 0)}</td>
                  <td className="py-2 pr-4">{Number(job.records_updated ?? 0)}</td>
                  <td className="py-2 pr-4">{Number(job.records_failed ?? 0)}</td>
                  <td className="py-2">{job.duration_ms ? `${job.duration_ms}ms` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
