const STEPS = ["Welcome", "Movies", "Genres", "People", "Preferences", "Review"];

export function OnboardingProgress({ step }: { step: number }) {
  return (
    <nav className="onboarding-progress" aria-label="Onboarding progress">
      {STEPS.map((label, index) => (
        <div
          key={label}
          className={`onboarding-progress__item ${index === step ? "is-active" : ""} ${index < step ? "is-done" : ""}`}
        >
          <span className="onboarding-progress__num">{String(index + 1).padStart(2, "0")}</span>
          <span className="onboarding-progress__label">{label}</span>
        </div>
      ))}
    </nav>
  );
}

export const ONBOARDING_STEP_LABELS = STEPS;
