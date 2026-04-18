import { AnnualSummaryPage } from "@/components/pages/annual-summary-page";

export default async function Page({
  params,
}: {
  params: Promise<{ year: string }>;
}) {
  const { year } = await params;
  return <AnnualSummaryPage year={Number(year)} />;
}
