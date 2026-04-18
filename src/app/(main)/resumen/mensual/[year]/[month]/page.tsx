import { MonthlySummaryPage } from "@/components/pages/monthly-summary-page";

export default async function Page({
  params,
}: {
  params: Promise<{ year: string; month: string }>;
}) {
  const { year, month } = await params;
  return (
    <MonthlySummaryPage year={Number(year)} month={Number(month)} />
  );
}
