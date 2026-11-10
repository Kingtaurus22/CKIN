import type { Metadata } from "next";
import { AuthPanel, SurveyorHero } from "@/src/components/auth/AuthLayout";
import RegisterSurveyorForm from "@/src/components/auth/RegisterSurveyorForm";

export const metadata: Metadata = { title: "Daftar sebagai surveyor" };

export default function RegisterSurveyorPage() {
  return (
    <main className="auth-page">
      <SurveyorHero />
      <AuthPanel wide>
        <RegisterSurveyorForm />
      </AuthPanel>
    </main>
  );
}
