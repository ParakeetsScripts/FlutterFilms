"use client";

import { Drawer } from "@/components/ui/Drawer";
import { castRoleLine } from "@/lib/movie/detail-helpers";
import { getProfileUrl } from "@/lib/tmdb/images";
import type { CreditPerson } from "@/lib/tmdb/types";
import { personPath } from "@/lib/slug";
import Link from "next/link";
import { useState } from "react";

const PREVIEW = 10;

function CastCard({ person }: { person: CreditPerson }) {
  const role = castRoleLine(person);
  return (
    <Link href={personPath(person.id, person.name)} className="cast-card">
      <div className="cast-card__photo poster-fallback">
        {person.profilePath ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={getProfileUrl(person.profilePath) ?? ""} alt={person.name} className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="flex h-full items-end p-2 text-xs text-[var(--text-muted)]">{person.name}</div>
        )}
      </div>
      <p className="cast-card__name">{person.name}</p>
      {role ? <p className="cast-card__role">{role}</p> : null}
    </Link>
  );
}

export function CastBlock({ cast }: { cast: CreditPerson[] }) {
  const [open, setOpen] = useState(false);
  const preview = cast.slice(0, PREVIEW);

  if (!cast.length) return null;

  return (
    <section className="detail-section">
      <div className="detail-section__header">
        <h2 className="section-title">Cast</h2>
        {cast.length > PREVIEW && (
          <button type="button" className="detail-link" onClick={() => setOpen(true)}>
            View all cast →
          </button>
        )}
      </div>
      <div className="row-scroller">
        {preview.map((person) => (
          <CastCard key={`${person.id}-${person.character ?? person.order}`} person={person} />
        ))}
      </div>
      <Drawer open={open} onClose={() => setOpen(false)} title="Full cast">
        <div className="cast-drawer-grid">
          {cast.map((person) => (
            <CastCard key={`drawer-${person.id}-${person.character}`} person={person} />
          ))}
        </div>
      </Drawer>
    </section>
  );
}
