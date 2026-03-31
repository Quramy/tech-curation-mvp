import { prisma } from "../lib/prisma";
import { getCurrentWeekInfo, getWeekInfo } from "../lib/week";
import { WeeklySummary } from "../components/WeeklySummary/WeeklySummary";
import { TopicTags } from "../components/TopicTags/TopicTags";
import { ArticleCard } from "../components/ArticleCard/ArticleCard";
import { PipelineTrigger } from "../components/PipelineTrigger/PipelineTrigger";
import { PipelineStatus } from "../components/PipelineStatus/PipelineStatus";
import { PipelineSection } from "../components/PipelineSection/PipelineSection";
import { getPipelineStatus } from "../actions/pipeline";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

async function findArticlesForWeek(weekInfo: ReturnType<typeof getCurrentWeekInfo>) {
  return prisma.article.findMany({
    where: {
      status: "processed",
      OR: [
        {
          publishedAt: { gte: weekInfo.startDate, lt: weekInfo.endDate },
        },
        {
          publishedAt: null,
          fetchedAt: { gte: weekInfo.startDate, lt: weekInfo.endDate },
        },
      ],
    },
    include: {
      feed: true,
      summary: true,
      topics: true,
      score: true,
    },
    orderBy: { score: { totalScore: "desc" } },
  });
}

export default async function DigestPage() {
  let weekInfo = getCurrentWeekInfo();
  let articles = await findArticlesForWeek(weekInfo);

  // 今週に記事がない場合、最新の processed 記事がある週にフォールバック
  if (articles.length === 0) {
    const latest = await prisma.article.findFirst({
      where: { status: "processed" },
      orderBy: { publishedAt: "desc" },
      select: { publishedAt: true, fetchedAt: true },
    });
    if (latest) {
      const date = latest.publishedAt || latest.fetchedAt;
      weekInfo = getWeekInfo(date);
      articles = await findArticlesForWeek(weekInfo);
    }
  }

  const cache = await prisma.weeklyDigestCache.findUnique({
    where: { weekKey: weekInfo.weekKey },
  });

  const pipelineStatus = await getPipelineStatus(weekInfo.weekKey);

  const highlightedTopics: string[] = cache?.highlightedTopicsJson
    ? JSON.parse(cache.highlightedTopicsJson)
    : [];

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
    </div>
  );
}
