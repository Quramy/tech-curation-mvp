import type { PipelineStatus as Status } from "../../actions/pipeline";
import styles from "./PipelineStatus.module.css";

type Props = {
  status: Status;
};

export function PipelineStatus({ status }: Props) {
  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Pipeline Status</h3>
      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.count}>{status.total}</span>
          <span className={styles.label}>Total</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.count}>{status.fetched}</span>
          <span className={styles.label}>Fetched</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.count}>{status.extracted}</span>
          <span className={styles.label}>Extracted</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.count}>{status.processed}</span>
          <span className={styles.label}>Processed</span>
        </div>
        <div className={`${styles.stat} ${status.failed > 0 ? styles.error : ""}`}>
          <span className={styles.count}>{status.failed}</span>
          <span className={styles.label}>Failed</span>
        </div>
      </div>
    </div>
  );
}
