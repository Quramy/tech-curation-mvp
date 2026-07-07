import "dotenv/config";
import { prisma } from "../src/lib/prisma";

type Bucket =
  | "extraction_failed"
  | "no_content"
  | "topics_too_small"
  | "topics_too_big"
  | "llm_other"
  | "other";

function bucketOf(errorMessage: string | null): Bucket {
  if (!errorMessage) return "other";
  if (errorMessage.startsWith("Extraction failed")) return "extraction_failed";
  if (errorMessage.startsWith("No content text available"))
    return "no_content";
  if (errorMessage.startsWith("LLM processing failed")) {
    if (/"code":\s*"too_small"/.test(errorMessage)) return "topics_too_small";
    if (/"code":\s*"too_big"/.test(errorMessage)) return "topics_too_big";
    return "llm_other";
  }
  return "other";
}

async function main() {
  const [fetched, extracted, processed, failed] = await Promise.all([
    prisma.article.count({ where: { status: "fetched" } }),
    prisma.article.count({ where: { status: "extracted" } }),
    prisma.article.count({ where: { status: "processed" } }),
    prisma.article.count({ where: { status: "failed" } }),
  ]);

  console.log("=== Status counts (all time) ===");
  console.log({ fetched, extracted, processed, failed });

  const failedArticles = await prisma.article.findMany({
    where: { status: "failed" },
    select: {
      title: true,
      errorMessage: true,
      feed: { select: { name: true } },
    },
  });

  const processedByFeed = await prisma.article.groupBy({
    by: ["feedId"],
    where: { status: "processed" },
    _count: true,
  });
  const processedCountByFeedId = new Map(
    processedByFeed.map((r) => [r.feedId, r._count]),
  );

  console.log("\n=== Failed count & rate by feed ===");
  const failedByFeedName = new Map<string, number>();
  for (const a of failedArticles) {
    failedByFeedName.set(
      a.feed.name,
      (failedByFeedName.get(a.feed.name) ?? 0) + 1,
    );
  }
  const feeds = await prisma.feed.findMany({ select: { id: true, name: true } });
  for (const feed of feeds) {
    const failedCount = failedByFeedName.get(feed.name) ?? 0;
    const processedCount = processedCountByFeedId.get(feed.id) ?? 0;
    const total = failedCount + processedCount;
    if (total === 0) continue;
    const rate = ((failedCount / total) * 100).toFixed(1);
    console.log(
      `  ${feed.name}: failed=${failedCount} processed=${processedCount} rate=${rate}%`,
    );
  }

  console.log("\n=== Failed reason buckets ===");
  const buckets = new Map<Bucket, typeof failedArticles>();
  for (const a of failedArticles) {
    const bucket = bucketOf(a.errorMessage);
    const list = buckets.get(bucket) ?? [];
    list.push(a);
    buckets.set(bucket, list);
  }
  for (const [bucket, articles] of buckets) {
    console.log(`  ${bucket}: ${articles.length}`);
  }

  console.log("\n=== Samples per bucket (up to 3 each) ===");
  for (const [bucket, articles] of buckets) {
    console.log(`\n--- ${bucket} ---`);
    for (const a of articles.slice(0, 3)) {
      console.log(`[${a.feed.name}] ${a.title}`);
      console.log(`  -> ${a.errorMessage}`);
    }
  }
}

main()
  .then(() => prisma.$disconnect())
  .then(() => process.exit(0));
