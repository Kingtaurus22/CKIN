import type { Metadata } from "next";
import { AdminHome } from "@/src/components/admin/AdminPages";

export const metadata: Metadata = { title: "Super admin" };

export default function AdminPage() {
  return <AdminHome />;
}
