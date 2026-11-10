import type { Metadata } from "next";
import { AdminSurveyors } from "@/src/components/admin/AdminPages";

export const metadata: Metadata = { title: "Verifikasi surveyor" };

export default function AdminSurveyorsPage() {
  return <AdminSurveyors />;
}
