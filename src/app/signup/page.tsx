import { SignupForm } from "@/components/auth/AuthForm";

export default function SignupPage() {
  return (
    <div className="page-container page-section max-w-md mx-auto">
      <header className="page-header">
        <p className="eyebrow">Account</p>
        <h1 className="page-header__title">Create account</h1>
        <p className="page-header__subtitle">Your watch history, Taste DNA, and Cinema Agent follow you across devices.</p>
      </header>
      <SignupForm />
    </div>
  );
}
