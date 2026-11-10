import type { Metadata } from "next";
import CustomerWallet from "@/src/components/customer/CustomerWallet";

export const metadata: Metadata = { title: "Saldo saya" };

export default function WalletPage() {
  return <CustomerWallet />;
}
