"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "../lib/prisma";
import { collectAllFeeds } from "../services/collector";
import { extractAllPending } from "../services/extractor";
import { processAllPending } from "../services/articleProcessor";
import { generateWeeklySummary } from "../services/weeklyProcessor";
import { getWeekInfoFromKey, weekArticleFilter } from "../lib/week";

export async function triggerCollection() {
  const results = await collectAllFeeds();
  const collected = results.reduce((sum, r) => sum + r.collected, 0);
  const skipped = results.reduce((sum, r) => sum + r.skipped, 0);
  revalidatePath("/");
  return { collected, skipped };
}

export async function triggerExtraction(weekKey: string) {
  const result = await extractAllPending(weekKey);
  revalidatePath("/");
  return result;
}

export async function triggerArticleProcessing(weekKey: string) {
  const result = await processAllPending(weekKey);
  revalidatePath("/");
  return result;
}

export async function triggerWeeklyProcessing(weekKey: string) {
  await generateWeeklySummary(weekKey);
  revalidatePath("/");
}

export async function triggerFullPipeline(weekKey: string) {
  const collectResults = await collectAllFeeds();
  const collected = collectResults.reduce((s, r) => s + r.collected, 0);

  const extractResult = await extractAllPending(weekKey);
  const processResult = await processAllPending(weekKey);
  await generateWeeklySummary(weekKey);

  revalidatePath("/");
  return {
    collected,
    extracted: extractResult.extracted,
    processed: processResult.processed,
    failed: extractResult.failed + processResult.failed,
  };
}

export async function retryFailedArticles(weekKey: string) {
  const weekInfo = getWeekInfoFromKey(weekKey);
  const filter = weekArticleFilter(weekInfo);

  const failedWithContent = await prisma.article.updateMany({
    where: { status: "failed", contentText: { not: null }, ...filter },
    data: { status: "extracted", errorMessage: null },
  });
  const failedWithoutContent = await prisma.article.updateMany({
    where: { status: "failed", contentText: null, ...filter },
    data: { status: "fetched", errorMessage: null },
  });

  const extractResult = await extractAllPending(weekKey);
  const processResult = await processAllPending(weekKey);

  revalidatePath("/");
  return {
    retried: failedWithContent.count + failedWithoutContent.count,
    extracted: extractResult.extracted,
    processed: processResult.processed,
  };
}

export type PipelineStatus = {
  fetched: number;
  extracted: number;
  processed: number;
  failed: number;
  total: number;
};

export async function getPipelineStatus(
  weekKey: string,
): Promise<PipelineStatus> {
  const weekInfo = getWeekInfoFromKey(weekKey);
  const filter = weekArticleFilter(weekInfo);

  const [fetched, extracted, processed, failed] = await Promise.all([
    prisma.article.count({ where: { status: "fetched", ...filter } }),
    prisma.article.count({ where: { status: "extracted", ...filter } }),
    prisma.article.count({ where: { status: "processed", ...filter } }),
    prisma.article.count({ where: { status: "failed", ...filter } }),
  ]);
  return {
    fetched,
    extracted,
    processed,
    failed,
    total: fetched + extracted + processed + failed,
  };
}
