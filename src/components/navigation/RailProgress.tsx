"use client";

type RailProgressProps = {
  progress: number;
  visible: boolean;
};

export function RailProgress({ progress, visible }: RailProgressProps) {
  if (!visible) return null;
  const clamped = Math.min(1, Math.max(0, progress));
  return (
    <div className="cinematic-rail__progress" aria-hidden="true">
      <div className="cinematic-rail__progress-track">
        <div className="cinematic-rail__progress-fill" style={{ width: `${clamped * 100}%` }} />
      </div>
    </div>
  );
}
