import type { Metadata } from "next";
import CustomerDashboard from "@/src/components/customer/CustomerDashboard";

export const metadata: Metadata = { title: "Dashboard" };

export default function CustomerHomePage() {
  return <CustomerDashboard />;
}
