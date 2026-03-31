"use client";

import { useState, type ReactNode } from "react";
import styles from "./PipelineSection.module.css";

type Props = {
  children: ReactNode;
};

export function PipelineSection({ children }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className={styles.container}>
      <button
        type="button"
        className={styles.toggle}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className={styles.label}>Pipeline</span>
        <span className={`${styles.arrow} ${open ? styles.open : ""}`}>▶</span>
      </button>
      {open && <div className={styles.content}>{children}</div>}
    </div>
  );
}
