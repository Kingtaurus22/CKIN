import type { Metadata } from "next";
import PreferenceStep from "@/src/components/order/PreferenceStep";

export const metadata: Metadata = { title: "Pesanan baru · Preferensi" };

export default function Page() {
  return <PreferenceStep />;
}
