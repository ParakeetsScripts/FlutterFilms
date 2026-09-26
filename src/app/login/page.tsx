import { LoginForm } from "@/components/auth/AuthForm";

export default function LoginPage() {
  return (
    <div className="page-container page-section max-w-md mx-auto">
      <header className="page-header">
        <p className="eyebrow">Account</p>
        <h1 className="page-header__title">Sign in</h1>
      </header>
      <LoginForm />
    </div>
  );
}
