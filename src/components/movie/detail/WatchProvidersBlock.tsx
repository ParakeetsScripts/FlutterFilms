"use client";

import { useUserLibrary } from "@/components/providers/UserLibraryProvider";
import { REGIONS } from "@/lib/regions";
import { getProviderLogoUrl } from "@/lib/tmdb/images";
import { JUSTWATCH_ATTRIBUTION } from "@/lib/tmdb/constants";
import type { WatchProviderGroup } from "@/lib/tmdb/types";
import { useCallback, useEffect, useState } from "react";

export function WatchProvidersBlock({
  movieId,
  initial,
}: {
  movieId: number;
  initial: WatchProviderGroup | null;
}) {
  const { settings, updateSettings } = useUserLibrary();
  const [providers, setProviders] = useState(initial);
  const [loading, setLoading] = useState(false);
  const regionName = REGIONS.find((r) => r.code === settings.region)?.name ?? settings.region;

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/movies/${movieId}/providers?region=${settings.region}`);
      if (res.ok) setProviders(await res.json());
    } finally {
      setLoading(false);
    }
  }, [movieId, settings.region]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const groups = providers
    ? [
        { label: "Streaming", items: providers.streaming },
        { label: "Rent", items: providers.rent },
        { label: "Buy", items: providers.buy },
      ].filter((g) => g.items.length)
    : [];

  const hasProviders = groups.length > 0;

  return (
    <section className="detail-section">
      <div className="detail-section__header">
        <h2 className="section-title">Where to watch</h2>
        <div className="detail-region">
          <label className="detail-region__label">
            Region
            <select
              value={settings.region}
              onChange={(e) => {
                updateSettings({ region: e.target.value });
                void refresh();
              }}
              className="detail-region__select"
            >
              {REGIONS.map((r) => (
                <option key={r.code} value={r.code}>{r.name}</option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {hasProviders ? (
        <div className="provider-list">
          {groups.map((group) => (
            <div key={group.label} className="provider-group">
              <p className="eyebrow">{group.label}</p>
              <ul className="provider-group__items">
                {group.items.map((item) => (
                  <li key={`${group.label}-${item.id}`} className="provider-item">
                    {item.logoPath ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={getProviderLogoUrl(item.logoPath) ?? ""} alt="" className="provider-item__logo" />
                    ) : null}
                    <span>{item.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {providers?.link && (
            <a href={providers.link} className="detail-link">Open availability page →</a>
          )}
        </div>
      ) : (
        <div className="detail-empty">
          <p>No providers currently listed for {regionName}.</p>
          <p className="detail-empty__hint">Availability changes by region and over time.</p>
          <button type="button" className="btn btn-secondary mt-4" onClick={refresh} disabled={loading}>
            {loading ? "Checking…" : "Refresh availability"}
          </button>
        </div>
      )}
      <p className="detail-attribution">{JUSTWATCH_ATTRIBUTION}</p>
    </section>
  );
}
