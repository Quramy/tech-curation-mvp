import { notFound } from "next/navigation";
import { DigestContent } from "../../../../components/DigestContent/DigestContent";

export const dynamic = "force-dynamic";

export default async function WeeklyPage({
  params,
}: {
  params: Promise<{ weekKey: string }>;
}) {
  const { weekKey } = await params;
  if (!/^\d{4}-W\d{2}$/.test(weekKey)) {
    notFound();
  }
  return <DigestContent weekKey={weekKey} />;
}
