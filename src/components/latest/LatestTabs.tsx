"use client";

import { MovieRow } from "@/components/movie/MovieRow";
import type { MovieSummary } from "@/lib/tmdb/types";
import { useState } from "react";

type Tab = "updated" | "added" | "upcoming";

export function LatestTabs({
  updated,
  added,
  upcoming,
}: {
  updated: MovieSummary[];
  added: MovieSummary[];
  upcoming: MovieSummary[];
}) {
  const [tab, setTab] = useState<Tab>("updated");
  const tabs: Array<{ id: Tab; label: string; movies: MovieSummary[]; showUpdated?: boolean }> = [
    { id: "updated", label: "Recently updated", movies: updated, showUpdated: true },
    { id: "added", label: "Newly added", movies: added },
    { id: "upcoming", label: "Upcoming", movies: upcoming },
  ];
  const active = tabs.find((t) => t.id === tab) ?? tabs[0];

  return (
    <div>
      <div className="latest-tabs" role="tablist">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            className={`latest-tabs__tab ${tab === item.id ? "is-active" : ""}`}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <MovieRow
        title={active.label}
        movies={active.movies}
        showUpdated={active.showUpdated}
        empty="Nothing in this section yet. Sync jobs will populate it automatically."
      />
    </div>
  );
}
