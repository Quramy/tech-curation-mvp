import { prisma } from "../../lib/prisma";
import { WeekNavLinks } from "../../components/WeekNav/WeekNavLinks";
import styles from "./layout.module.css";

export default async function DigestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const weeks = await prisma.weeklyDigestCache.findMany({
    orderBy: { weekStartDate: "desc" },
    select: { weekKey: true, weekTitle: true },
  });

  return (
    <div className={styles.container}>
      <aside className={styles.sidebar}>
        <WeekNavLinks weeks={weeks} />
      </aside>
      <div className={styles.main}>{children}</div>
    </div>
  );
}
