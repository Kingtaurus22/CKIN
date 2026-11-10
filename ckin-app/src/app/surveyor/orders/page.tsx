import type { Metadata } from "next";
import MyOrders from "@/src/components/surveyor/MyOrders";

export const metadata: Metadata = { title: "Order survei" };

/** Daftar order yang sudah diambil surveyor (Anggota 3). */
export default function SurveyorOrdersPage() {
  return <MyOrders />;
}
