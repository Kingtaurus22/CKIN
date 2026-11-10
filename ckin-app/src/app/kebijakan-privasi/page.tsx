import type { Metadata } from "next";
import LegalPage from "@/src/components/legal/LegalPage";
import { LEGAL_HREF, PRIVACY_POLICY } from "@/src/lib/legal";

export const metadata: Metadata = { title: "Kebijakan Privasi" };

export default function PrivacyPage() {
  return <LegalPage doc={PRIVACY_POLICY} current={LEGAL_HREF.privacy} />;
}
