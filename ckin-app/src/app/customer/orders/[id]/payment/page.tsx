import type { Metadata } from "next";
import { Suspense } from "react";
import PaymentStep from "@/src/components/order/PaymentStep";
import PageFallback from "@/src/components/ui/PageFallback";

export const metadata: Metadata = { title: "Pembayaran pesanan" };

type Props = { params: Promise<{ id: string }> };

async function Content({ params }: Props) {
  const { id } = await params;
  return <PaymentStep id={id} />;
}

export default function PaymentPage({ params }: Props) {
  return (
    <Suspense fallback={<PageFallback />}>
      <Content params={params} />
    </Suspense>
  );
}
