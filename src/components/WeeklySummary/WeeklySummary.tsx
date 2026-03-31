import type { WeekInfo } from "../../lib/types";
import styles from "./WeeklySummary.module.css";

type Props = {
  weekInfo: WeekInfo;
  summaryText: string | null;
};

export function WeeklySummary({ weekInfo, summaryText }: Props) {
  return (
    <section className={styles.summary}>
      <h1 className={styles.title}>{weekInfo.title}</h1>
      <p className={styles.dateRange}>{weekInfo.dateRange}</p>
      {summaryText ? (
        <p className={styles.text}>{summaryText}</p>
      ) : (
        <p className={styles.empty}>週サマリーはまだ生成されていません。</p>
      )}
    </section>
  );
}
