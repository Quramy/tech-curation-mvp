"use client";

import { useTransition } from "react";
import { deleteFeed, toggleFeedActive } from "../../actions/feeds";
import type { Feed } from "../../generated/prisma/client";
import styles from "./FeedList.module.css";

type Props = {
  feeds: Feed[];
};

export function FeedList({ feeds }: Props) {
  const [isPending, startTransition] = useTransition();

  if (feeds.length === 0) {
    return <p className={styles.empty}>フィードが登録されていません。</p>;
  }

  return (
    <table className={styles.table}>
      <thead>
        <tr>
          <th>Name</th>
          <th>URL</th>
          <th>Type</th>
          <th>Active</th>
          <th />
        </tr>
      </thead>
      <tbody>
        {feeds.map((feed) => (
          <tr key={feed.id} className={!feed.isActive ? styles.inactive : ""}>
            <td>{feed.name}</td>
            <td className={styles.url}>{feed.url}</td>
            <td>{feed.type}</td>
            <td>
              <button
                type="button"
                className={styles.toggleBtn}
                disabled={isPending}
                onClick={() =>
                  startTransition(() => toggleFeedActive(feed.id))
                }
              >
                {feed.isActive ? "ON" : "OFF"}
              </button>
            </td>
            <td>
              <button
                type="button"
                className={styles.deleteBtn}
                disabled={isPending}
                onClick={() => {
                  if (confirm(`"${feed.name}" を削除しますか？`)) {
                    startTransition(() => deleteFeed(feed.id));
                  }
                }}
              >
                Delete
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
