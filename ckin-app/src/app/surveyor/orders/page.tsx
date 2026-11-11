import type { Metadata } from "next";
import MyOrders from "@/src/components/surveyor/MyOrders";
import { Suspense } from "react";
import PageFallback from "@/src/components/ui/PageFallback";

export const metadata: Metadata = { title: "Order survei" };

/** Daftar order yang sudah diambil surveyor (Anggota 3). */
export default function SurveyorOrdersPage() {
  return (
    <Suspense fallback={<PageFallback />}>
      <MyOrders />
    </Suspense>
  )
}
