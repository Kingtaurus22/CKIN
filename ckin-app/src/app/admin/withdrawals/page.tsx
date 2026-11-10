import type { Metadata } from "next";
import { AdminWithdrawals } from "@/src/components/admin/AdminPages";

export const metadata: Metadata = { title: "Penarikan dana" };

export default function AdminWithdrawalsPage() {
  return <AdminWithdrawals />;
}
