import type { Metadata } from "next";
import OpenOrders from "@/src/components/surveyor/OpenOrders";

export const metadata: Metadata = { title: "Order tersedia" };

/** Order terbayar di area jangkauan surveyor (Anggota 3). */
export default function SurveyorOpenOrdersPage() {
  return <OpenOrders />;
}
