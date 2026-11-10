import type { ReactNode } from "react";
import AppShell from "@/src/components/workspace/AppShell";

/** Semua halaman /admin/** khusus super admin. Akses dijaga oleh src/proxy.ts dan requireSession("admin"). */
export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AppShell role="admin">{children}</AppShell>;
}
