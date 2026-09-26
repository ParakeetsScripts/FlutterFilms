import { InterviewWizard } from "@/components/intelligence/InterviewWizard";

export default function InterviewPage() {
  return (
    <div className="page-container page-section max-w-2xl">
      <header className="page-header mb-8">
        <p className="eyebrow">Personal AI</p>
        <h1 className="page-header__title">AI Movie Interview</h1>
      </header>
      <InterviewWizard />
    </div>
  );
}
