import type { Metadata } from "next";
import AccountSettings from "@/src/components/workspace/AccountSettings";

export const metadata: Metadata = { title: "Pengaturan akun" };

export default function SettingsPage() {
  return <AccountSettings />;
}
