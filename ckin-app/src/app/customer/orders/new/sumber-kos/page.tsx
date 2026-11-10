import type { Metadata } from "next";
import SourceStep from "@/src/components/order/SourceStep";

export const metadata: Metadata = { title: "Pesanan baru · Sumber kos" };

export default function Page() {
  return <SourceStep />;
}
