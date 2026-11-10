import type { Metadata } from "next";
import LegalPage from "@/src/components/legal/LegalPage";
import { LEGAL_HREF, SURVEYOR_TERMS } from "@/src/lib/legal";

export const metadata: Metadata = { title: "Perjanjian Kemitraan Surveyor" };

export default function SurveyorTermsPage() {
  return <LegalPage doc={SURVEYOR_TERMS} current={LEGAL_HREF.surveyor} />;
}
