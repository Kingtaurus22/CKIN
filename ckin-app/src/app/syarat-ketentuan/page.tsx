import type { Metadata } from "next";
import LegalPage from "@/src/components/legal/LegalPage";
import { CUSTOMER_TERMS, LEGAL_HREF } from "@/src/lib/legal";

export const metadata: Metadata = { title: "Syarat & Ketentuan Pengguna" };

export default function CustomerTermsPage() {
  return <LegalPage doc={CUSTOMER_TERMS} current={LEGAL_HREF.customer} />;
}
