import { getCurrentWeekInfo } from "../../lib/week";
import { DigestContent } from "../../components/DigestContent/DigestContent";

export const dynamic = "force-dynamic";

export default async function TopPage() {
  const weekInfo = getCurrentWeekInfo();
  return <DigestContent weekKey={weekInfo.weekKey} />;
}
