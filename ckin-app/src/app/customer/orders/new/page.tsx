import type { Metadata } from "next";
import LocationStep from "@/src/components/order/LocationStep";

export const metadata: Metadata = { title: "Pesanan baru" };

export default function Page() {
  return <LocationStep />;
}
