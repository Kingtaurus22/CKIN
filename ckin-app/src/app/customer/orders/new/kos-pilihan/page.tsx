import type { Metadata } from "next";
import TargetsStep from "@/src/components/order/TargetsStep";

export const metadata: Metadata = { title: "Pesanan baru · Kos pilihan" };

export default function Page() {
  return <TargetsStep />;
}
