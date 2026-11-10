import type { Metadata } from "next";
import ScheduleStep from "@/src/components/order/ScheduleStep";

export const metadata: Metadata = { title: "Pesanan baru · Jadwal survei" };

export default function Page() {
  return <ScheduleStep />;
}
