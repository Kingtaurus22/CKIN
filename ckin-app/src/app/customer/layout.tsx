import type { ReactNode } from "react";
import AppShell from "@/src/components/workspace/AppShell";

/** Semua halaman /customer/** memakai sidebar & topbar customer. Akses dijaga oleh src/proxy.ts. */
export default function CustomerLayout({ children }: { children: ReactNode }) {
  return <AppShell role="customer">{children}</AppShell>;
}
