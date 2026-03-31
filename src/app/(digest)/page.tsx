import { getPreviousWeekInfo } from "../../lib/week";
import { DigestContent } from "../../components/DigestContent/DigestContent";

export const dynamic = "force-dynamic";

export default async function TopPage() {
  const weekInfo = getPreviousWeekInfo();
  return <DigestContent weekKey={weekInfo.weekKey} />;
}
