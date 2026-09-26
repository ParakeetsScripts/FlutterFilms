import { AdminProductDashboard } from "@/components/admin/AdminProductDashboard";

export default function AdminProductPage() {
  return (
    <div className="page-container page-section">
      <header className="page-header">
        <p className="eyebrow">Admin</p>
        <h1 className="page-header__title">Product Analytics</h1>
        <p className="page-header__subtitle">Real database metrics only — never fabricated.</p>
      </header>
      <AdminProductDashboard />
    </div>
  );
}
