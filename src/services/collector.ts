import RssParser from "rss-parser";
import { prisma } from "../lib/prisma";
import { normalizeUrl } from "../lib/url";

const parser = new RssParser();

export type CollectionResult = {
  feedId: string;
  feedName: string;
  collected: number;
  skipped: number;
  errors: string[];
};

export async function collectSingleFeed(
  feedId: string,
): Promise<CollectionResult> {
  const feed = await prisma.feed.findUniqueOrThrow({ where: { id: feedId } });
  const result: CollectionResult = {
    feedId,
    feedName: feed.name,
    collected: 0,
    skipped: 0,
    errors: [],
  };

  let parsed: RssParser.Output<Record<string, unknown>>;
  try {
    parsed = await parser.parseURL(feed.url);
  } catch (e) {
    result.errors.push(
      `Failed to fetch feed: ${e instanceof Error ? e.message : String(e)}`,
    );
    return result;
  }

  for (const item of parsed.items) {
    if (!item.link) continue;

    const normalizedUrl = normalizeUrl(item.link);

    const existing = await prisma.article.findUnique({
      where: { url: normalizedUrl },
    });
    if (existing) {
      result.skipped++;
      continue;
    }

    try {
      await prisma.article.create({
        data: {
          feedId: feed.id,
          title: item.title || "Untitled",
          url: normalizedUrl,
          publishedAt: item.isoDate ? new Date(item.isoDate) : null,
          authorName: (item.creator as string) || (item.author as string) || null,
          status: "fetched",
        },
      });
      result.collected++;
    } catch (e) {
      result.errors.push(
        `Failed to save article "${item.title}": ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  }

  return result;
}

export async function collectAllFeeds(): Promise<CollectionResult[]> {
  const feeds = await prisma.feed.findMany({ where: { isActive: true } });
  const results: CollectionResult[] = [];

  for (const feed of feeds) {
    console.log(`Collecting: ${feed.name} (${feed.url})`);
    const result = await collectSingleFeed(feed.id);
    console.log(
      `  -> collected: ${result.collected}, skipped: ${result.skipped}`,
    );
    if (result.errors.length > 0) {
      console.log(`  -> errors: ${result.errors.join(", ")}`);
    }
    results.push(result);
  }

  return results;
}
