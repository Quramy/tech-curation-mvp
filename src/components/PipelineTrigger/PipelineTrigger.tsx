"use client";

import { useTransition, useState } from "react";
import {
  triggerCollection,
  triggerExtraction,
  triggerArticleProcessing,
  triggerWeeklyProcessing,
  triggerFullPipeline,
} from "../../actions/pipeline";
import styles from "./PipelineTrigger.module.css";

type Props = {
  weekKey: string;
};

export function PipelineTrigger({ weekKey }: Props) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function run(label: string, action: () => Promise<string>) {
    setMessage(null);
    startTransition(async () => {
      try {
        const result = await action();
        setMessage(result);
      } catch (e) {
        setMessage(`Error: ${e instanceof Error ? e.message : String(e)}`);
      }
    });
  }

  return (
    <div className={styles.container}>
      <div className={styles.buttons}>
        <button
          type="button"
          className={styles.button}
          disabled={isPending}
          onClick={() =>
            run("collect", async () => {
              const r = await triggerCollection();
              return `Collected: ${r.collected}, Skipped: ${r.skipped}`;
            })
          }
        >
          Collect
        </button>
        <button
          type="button"
          className={styles.button}
          disabled={isPending}
          onClick={() =>
            run("extract", async () => {
              const r = await triggerExtraction(weekKey);
              return `Extracted: ${r.extracted}, Failed: ${r.failed}`;
            })
          }
        >
          Extract
        </button>
        <button
          type="button"
          className={styles.button}
          disabled={isPending}
          onClick={() =>
            run("process", async () => {
              const r = await triggerArticleProcessing(weekKey);
              return `Processed: ${r.processed}, Failed: ${r.failed}`;
            })
          }
        >
          Process
        </button>
        <button
          type="button"
          className={styles.button}
          disabled={isPending}
          onClick={() =>
            run("weekly", async () => {
              await triggerWeeklyProcessing(weekKey);
              return "Weekly summary generated";
            })
          }
        >
          Weekly
        </button>
        <button
          type="button"
          className={`${styles.button} ${styles.primary}`}
          disabled={isPending}
          onClick={() =>
            run("all", async () => {
              const r = await triggerFullPipeline(weekKey);
              return `Collected: ${r.collected}, Extracted: ${r.extracted}, Processed: ${r.processed}, Failed: ${r.failed}`;
            })
          }
        >
          Run All
        </button>
      </div>
      {isPending && <p className={styles.pending}>Processing...</p>}
      {message && !isPending && <p className={styles.message}>{message}</p>}
    </div>
  );
}
