import { AdminReleaseDashboard } from "@/components/admin/AdminReleaseDashboard";

export const metadata = {
  title: "Release Command Center",
  description: "Deployment readiness for FlutterFilms by Ritvik M.",
};

export default function AdminReleasePage() {
  return (
    <div className="page-container page-section">
      <header className="page-header">
        <p className="eyebrow">Admin</p>
        <h1 className="page-header__title">Release command center</h1>
        <p className="page-header__subtitle">
          Honest readiness checks — never fabricated deployment status.
        </p>
      </header>
      <AdminReleaseDashboard />
    </div>
  );
}
