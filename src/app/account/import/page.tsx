import { ImportDeviceData } from "@/components/account/ImportDeviceData";

export default function ImportPage() {
  return (
    <div className="page-container page-section max-w-2xl">
      <header className="page-header">
        <p className="eyebrow">Welcome</p>
        <h1 className="page-header__title">Import your history</h1>
      </header>
      <ImportDeviceData />
    </div>
  );
}
