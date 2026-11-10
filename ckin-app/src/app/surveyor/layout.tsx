import type { ReactNode } from "react";
import AppShell from "@/src/components/workspace/AppShell";

/** Semua halaman /surveyor/** memakai sidebar & topbar surveyor. Akses dijaga oleh src/proxy.ts. */
export default function SurveyorLayout({ children }: { children: ReactNode }) {
  return <AppShell role="surveyor">{children}</AppShell>;
}
