"use client";

import { Drawer } from "@/components/ui/Drawer";
import { FEATURED_CREW_JOBS } from "@/lib/tmdb/crew-jobs";
import type { CreditPerson } from "@/lib/tmdb/types";
import { useState } from "react";

export function CrewBlock({ crew }: { crew: CreditPerson[] }) {
  const [open, setOpen] = useState(false);
  const featured = FEATURED_CREW_JOBS.map((job) => ({
    job,
    people: crew.filter((person) => person.job === job),
  })).filter((group) => group.people.length);

  if (!crew.length) return null;

  return (
    <section className="detail-section">
      <div className="detail-section__header">
        <h2 className="section-title">Crew</h2>
        {crew.length > featured.reduce((n, g) => n + g.people.length, 0) && (
          <button type="button" className="detail-link" onClick={() => setOpen(true)}>
            View full crew →
          </button>
        )}
      </div>
      <div className="crew-grid">
        {featured.map((group) => (
          <div key={group.job}>
            <p className="eyebrow">{group.job}</p>
            <p className="crew-grid__names">{group.people.map((p) => p.name).slice(0, 3).join(", ")}</p>
          </div>
        ))}
      </div>
      <Drawer open={open} onClose={() => setOpen(false)} title="Full crew">
        <div className="crew-drawer-list">
          {crew.map((person) => (
            <div key={`${person.id}-${person.job}`} className="crew-drawer-row">
              <span className="crew-drawer-row__job">{person.job}</span>
              <span>{person.name}</span>
            </div>
          ))}
        </div>
      </Drawer>
    </section>
  );
}
