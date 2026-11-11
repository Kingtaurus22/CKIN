import type { Metadata } from "next";
import SurveyorHome from "@/src/components/surveyor/SurveyorHome";
import { Suspense } from "react";
import PageFallback from "@/src/components/ui/PageFallback";

export const metadata: Metadata = { title: "Dashboard surveyor" };

export default function SurveyorDashboardPage() {
  return (
    <Suspense fallback={<PageFallback />}>
      <SurveyorHome />
    </Suspense>
  )
}
