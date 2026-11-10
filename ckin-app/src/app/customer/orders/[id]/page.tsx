import type { Metadata } from "next";
import { Suspense } from "react";
import CustomerOrderDetail from "@/src/components/customer/CustomerOrderDetail";
import PageFallback from "@/src/components/ui/PageFallback";

export const metadata: Metadata = { title: "Detail pesanan" };

type Props = { params: Promise<{ id: string }> };

// Parameter dinamis dibaca di dalam <Suspense> (wajib saat cacheComponents aktif).
async function Content({ params }: Props) {
  const { id } = await params;
  return <CustomerOrderDetail id={id} />;
}

export default function OrderDetailPage({ params }: Props) {
  return (
    <Suspense fallback={<PageFallback />}>
      <Content params={params} />
    </Suspense>
  );
}
