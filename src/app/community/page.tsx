import { CommunityHub } from "@/components/intelligence/CommunityHub";

export default function CommunityPage() {
  return (
    <div className="page-container page-section">
      <header className="page-header">
        <p className="eyebrow">Community</p>
        <h1 className="page-header__title">Social AI</h1>
        <p className="page-header__subtitle">Group picks, taste overlap, and collaborative discovery.</p>
      </header>
      <div className="mt-10">
        <CommunityHub />
      </div>
    </div>
  );
}
