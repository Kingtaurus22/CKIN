import type { Metadata } from "next";
import SurveyorHome from "@/src/components/surveyor/SurveyorHome";

export const metadata: Metadata = { title: "Dashboard surveyor" };

export default function SurveyorDashboardPage() {
  return <SurveyorHome />;
}
