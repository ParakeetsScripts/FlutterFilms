import { TonightPicker } from "@/components/tonight/TonightPicker";

export default function TonightPage() {
  return (
    <div className="page-container page-section max-w-3xl">
      <header className="page-header">
        <p className="eyebrow">Tonight</p>
        <h1 className="page-header__title">What should I watch?</h1>
        <p className="page-header__subtitle">One primary pick with clear reasons — no endless scrolling.</p>
      </header>
      <TonightPicker />
    </div>
  );
}
