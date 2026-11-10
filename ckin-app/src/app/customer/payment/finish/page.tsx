import type { Metadata } from "next";
import PaymentFinish from "@/src/components/order/PaymentFinish";

export const metadata: Metadata = { title: "Status pembayaran" };

export default function Page() {
  return <PaymentFinish />;
}
