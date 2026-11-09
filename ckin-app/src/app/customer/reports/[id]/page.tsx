import CustomerReportReviewPage from "@/src/components/customer/CustomerReportReviewPage";
export default async function ReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CustomerReportReviewPage id={id} />;
}
