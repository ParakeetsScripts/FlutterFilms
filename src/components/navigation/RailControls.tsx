"use client";

type RailControlsProps = {
  label: string;
  canScrollLeft: boolean;
  canScrollRight: boolean;
  onLeft: () => void;
  onRight: () => void;
};

export function RailControls({ label, canScrollLeft, canScrollRight, onLeft, onRight }: RailControlsProps) {
  return (
    <div className="cinematic-rail__controls" aria-hidden={!canScrollLeft && !canScrollRight}>
      <button
        type="button"
        className="cinematic-rail__arrow cinematic-rail__arrow--left"
        aria-label={`Scroll ${label} left`}
        disabled={!canScrollLeft}
        onClick={onLeft}
      >
        <span aria-hidden="true">‹</span>
      </button>
      <button
        type="button"
        className="cinematic-rail__arrow cinematic-rail__arrow--right"
        aria-label={`Scroll ${label} right`}
        disabled={!canScrollRight}
        onClick={onRight}
      >
        <span aria-hidden="true">›</span>
      </button>
    </div>
  );
}
