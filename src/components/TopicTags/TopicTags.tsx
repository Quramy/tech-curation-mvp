import styles from "./TopicTags.module.css";

type Props = {
  topics: string[];
};

export function TopicTags({ topics }: Props) {
  if (topics.length === 0) return null;

  return (
    <div className={styles.tags}>
      {topics.map((topic) => (
        <span key={topic} className={styles.tag}>
          {topic}
        </span>
      ))}
    </div>
  );
}
