import type { Metadata } from "next";
import { AuthPanel, CustomerHero } from "@/src/components/auth/AuthLayout";
import LoginForm from "@/src/components/auth/LoginForm";

export const metadata: Metadata = { title: "Masuk" };

export default function LoginPage() {
  return (
    <main className="auth-page">
      <CustomerHero />
      <AuthPanel>
        <LoginForm />
      </AuthPanel>
    </main>
  );
}
