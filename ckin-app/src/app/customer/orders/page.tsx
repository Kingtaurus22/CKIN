import type { Metadata } from "next";
import CustomerOrdersPage from "@/src/components/customer/CustomerOrdersPage";

export const metadata: Metadata = { title: "Pesanan saya" };

export default function OrdersPage() {
  return <CustomerOrdersPage />;
}
