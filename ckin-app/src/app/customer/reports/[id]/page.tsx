import type { Metadata } from "next";
import { Suspense } from "react";
import CustomerReport from "@/src/components/customer/CustomerReport";
import PageFallback from "@/src/components/ui/PageFallback";

export const metadata: Metadata = { title: "Laporan survei" };

type Props = { params: Promise<{ id: string }> };

async function Content({ params }: Props) {
  const { id } = await params;
  return <CustomerReport id={id} />;
}

export default function ReportPage({ params }: Props) {
  return (
    <Suspense fallback={<PageFallback />}>
      <Content params={params} />
    </Suspense>
  );
}
