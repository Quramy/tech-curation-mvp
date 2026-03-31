import { format } from "date-fns";
import { TopicTags } from "../TopicTags/TopicTags";
import styles from "./ArticleCard.module.css";

type Props = {
  title: string;
  url: string;
  sourceName: string;
  publishedAt: Date | null;
  shortSummary: string;
  totalScore: number;
  reasonTags: string[];
  ogImageUrl: string | null;
};

function scoreColor(score: number): string {
  if (score >= 70) return "var(--score-high)";
  if (score >= 40) return "var(--score-mid)";
  return "var(--score-low)";
}

export function ArticleCard({
  title,
  url,
  sourceName,
  publishedAt,
  shortSummary,
  totalScore,
  reasonTags,
  ogImageUrl,
}: Props) {
  return (
    <article className={styles.card}>
      <div className={styles.thumbnail}>
        {ogImageUrl ? (
          <img src={ogImageUrl} alt="" className={styles.image} />
        ) : (
          <div className={styles.placeholder}>
            {sourceName.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      <div className={styles.content}>
        <div className={styles.meta}>
          <span className={styles.source}>{sourceName}</span>
          {publishedAt && (
            <span className={styles.date}>
              {format(publishedAt, "yyyy/MM/dd")}
            </span>
          )}
        </div>
        <h3 className={styles.title}>
          <a href={url} target="_blank" rel="noopener noreferrer">
            {title}
          </a>
        </h3>
        <p className={styles.summary}>{shortSummary}</p>
        <div className={styles.footer}>
          <span
            className={styles.score}
            style={{ color: scoreColor(totalScore) }}
          >
            {totalScore}
          </span>
          <TopicTags topics={reasonTags} />
        </div>
      </div>
    </article>
  );
}
