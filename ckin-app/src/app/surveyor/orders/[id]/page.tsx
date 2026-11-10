import type { Metadata } from "next";
import { Suspense } from "react";
import ManageSurvey from "@/src/components/surveyor/ManageSurvey";
import PageFallback from "@/src/components/ui/PageFallback";

export const metadata: Metadata = { title: "Kelola survei" };

type Props = { params: Promise<{ id: string }> };

async function Content({ params }: Props) {
  const { id } = await params;
  return <ManageSurvey id={id} />;
}

/** Kelola survei: progres per kos, checklist, bukti foto/video, laporan (Anggota 3). */
export default function SurveyorOrderDetailPage({ params }: Props) {
  return (
    <Suspense fallback={<PageFallback />}>
      <Content params={params} />
    </Suspense>
  );
}
