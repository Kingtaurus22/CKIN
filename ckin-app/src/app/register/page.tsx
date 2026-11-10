import type { Metadata } from "next";
import { AuthPanel, CustomerHero } from "@/src/components/auth/AuthLayout";
import RegisterCustomerForm from "@/src/components/auth/RegisterCustomerForm";

export const metadata: Metadata = { title: "Daftar sebagai customer" };

export default function RegisterPage() {
  return (
    <main className="auth-page">
      <CustomerHero />
      <AuthPanel>
        <RegisterCustomerForm />
      </AuthPanel>
    </main>
  );
}
