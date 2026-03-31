import { prisma } from "../../lib/prisma";
import { getWeekInfoFromKey, weekArticleFilter } from "../../lib/week";
import { WeeklySummary } from "../WeeklySummary/WeeklySummary";
import { TopicTags } from "../TopicTags/TopicTags";
import { ArticleCard } from "../ArticleCard/ArticleCard";
import { PipelineTrigger } from "../PipelineTrigger/PipelineTrigger";
import { PipelineStatus } from "../PipelineStatus/PipelineStatus";
import { PipelineSection } from "../PipelineSection/PipelineSection";
import { getPipelineStatus } from "../../actions/pipeline";
import styles from "./DigestContent.module.css";

type Props = {
  weekKey: string;
};

export async function DigestContent({ weekKey }: Props) {
  const weekInfo = getWeekInfoFromKey(weekKey);

  const articles = await prisma.article.findMany({
    where: {
      status: "processed",
      ...weekArticleFilter(weekInfo),
    },
    include: {
      feed: true,
      summary: true,
      topics: true,
      score: true,
    },
    orderBy: { score: { totalScore: "desc" } },
  });

  const cache = await prisma.weeklyDigestCache.findUnique({
    where: { weekKey: weekInfo.weekKey },
  });

  const pipelineStatus = await getPipelineStatus(weekInfo.weekKey);

  const highlightedTopics: string[] = cache?.highlightedTopicsJson
    ? JSON.parse(cache.highlightedTopicsJson)
    : [];

  const hasData = articles.length > 0 || cache !== null;

  return (
    <div className={styles.page}>
      <WeeklySummary
        weekInfo={weekInfo}
        summaryText={cache?.summaryText ?? null}
      />

      {highlightedTopics.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>注目トピック</h2>
          <TopicTags topics={highlightedTopics} />
        </section>
      )}

      <PipelineSection>
        <PipelineStatus status={pipelineStatus} />
        <PipelineTrigger weekKey={weekInfo.weekKey} />
      </PipelineSection>

      {hasData ? (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            記事一覧 ({articles.length}件)
          </h2>
          {articles.length === 0 ? (
            <p className={styles.empty}>
              この週の記事はまだありません。パイプラインを実行してください。
            </p>
          ) : (
            <div className={styles.articleList}>
              {articles.map((article) => (
                <ArticleCard
                  key={article.id}
                  title={article.title}
                  url={article.url}
                  sourceName={article.feed.name}
                  publishedAt={article.publishedAt}
                  shortSummary={
                    article.summary?.shortSummary ?? "要約はありません"
                  }
                  totalScore={article.score?.totalScore ?? 0}
                  reasonTags={
                    article.score
                      ? JSON.parse(article.score.reasonTags)
                      : []
                  }
                  ogImageUrl={article.ogImageUrl}
                />
              ))}
            </div>
          )}
        </section>
      ) : (
        <section className={styles.section}>
          <p className={styles.empty}>
            この週のデータはまだありません。パイプラインを実行してください。
          </p>
        </section>
      )}
    </div>
  );
}
