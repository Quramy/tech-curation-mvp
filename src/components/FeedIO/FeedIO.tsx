"use client";

import { useRef, useState, useTransition } from "react";
import { exportFeeds, importFeeds } from "../../actions/feeds";
import styles from "./FeedIO.module.css";

export function FeedIO() {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    startTransition(async () => {
      const json = await exportFeeds();
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "feeds.json";
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // value をリセットして同じファイルを連続選択できるようにする
    event.target.value = "";
    if (!file) {
      return;
    }

    setMessage(null);
    startTransition(async () => {
      try {
        const text = await file.text();
        const { created, updated } = await importFeeds(text);
        setIsError(false);
        setMessage(`${created} 件追加 / ${updated} 件更新`);
      } catch (error) {
        setIsError(true);
        setMessage(
          error instanceof Error ? error.message : "インポートに失敗しました。",
        );
      }
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.actions}>
        <button
          type="button"
          className={styles.button}
          disabled={isPending}
          onClick={handleExport}
        >
          Export JSON
        </button>
        <button
          type="button"
          className={`${styles.button} ${styles.dangerButton}`}
          disabled={isPending}
          onClick={() => fileInputRef.current?.click()}
        >
          Import JSON
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          className={styles.fileInput}
          onChange={handleImport}
        />
      </div>
      {message && (
        <p className={isError ? styles.error : styles.success}>{message}</p>
      )}
    </div>
  );
}
