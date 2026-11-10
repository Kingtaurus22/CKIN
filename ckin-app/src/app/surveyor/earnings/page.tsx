import type { Metadata } from "next";
import Earnings from "@/src/components/surveyor/Earnings";

export const metadata: Metadata = { title: "Penghasilan" };

/** Pendapatan & penarikan dana surveyor (Anggota 3). */
export default function SurveyorEarningsPage() {
  return <Earnings />;
}
