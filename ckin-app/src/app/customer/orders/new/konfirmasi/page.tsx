import type { Metadata } from "next";
import ReviewStep from "@/src/components/order/ReviewStep";

export const metadata: Metadata = { title: "Pesanan baru · Konfirmasi" };

export default function Page() {
  return <ReviewStep />;
}
