"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./WeekNav.module.css";

type WeekEntry = {
  weekKey: string;
  weekTitle: string;
};

type Props = {
  weeks: WeekEntry[];
};

export function WeekNavLinks({ weeks }: Props) {
  const pathname = usePathname();

  function isActive(weekKey: string) {
    return pathname === `/weekly/${weekKey}`;
  }

  return (
    <nav className={styles.nav}>
      {weeks.length === 0 ? (
        <p className={styles.empty}>生成済みの週データがありません</p>
      ) : (
        <ul className={styles.list}>
          {weeks.map((week) => (
            <li key={week.weekKey}>
              <Link
                href={`/weekly/${week.weekKey}`}
                className={`${styles.link} ${isActive(week.weekKey) ? styles.active : ""}`}
              >
                {week.weekTitle}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </nav>
  );
}
