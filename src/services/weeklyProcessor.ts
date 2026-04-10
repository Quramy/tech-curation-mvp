import { z } from "zod";
import { openai } from "../lib/openai";
import { prisma } from "../lib/prisma";
import {
  getWeekInfo,
  getCurrentWeekInfo,
  getWeekInfoFromKey,
} from "../lib/week";

const WeeklyLLMResultSchema = z.object({
  summary_text: z.string(),
  highlighted_topics: z.array(z.string()).min(3).max(5),
});

type WeekArticleInput = {
  title: string;
  shortSummary: string;
  topics: string[];
  totalScore: number;
  reasonTags: string[];
};

async function gatherWeekArticles(
  weekStartDate: Date,
  weekEndDate: Date,
): Promise<WeekArticleInput[]> {
  const articles = await prisma.article.findMany({
    where: {
      status: "processed",
      OR: [
        { publishedAt: { gte: weekStartDate, lt: weekEndDate } },
        {
          publishedAt: null,
          fetchedAt: { gte: weekStartDate, lt: weekEndDate },
        },
      ],
    },
    include: {
      summary: true,
      topics: true,
      score: true,
    },
    orderBy: { score: { totalScore: "desc" } },
  });

  return articles
    .filter((a) => a.summary && a.score)
    .map((a) => ({
      title: a.title,
      shortSummary: a.summary!.shortSummary,
      topics: a.topics.map((t) => t.topic),
      totalScore: a.score!.totalScore,
      reasonTags: JSON.parse(a.score!.reasonTags) as string[],
    }));
}

function buildWeeklyPrompt(articles: WeekArticleInput[]): string {
  const articleList = articles
    .map(
      (a, i) =>
        `${i + 1}. [Score: ${a.totalScore}] ${a.title}\n   Topics: ${a.topics.join(", ")}\n   Summary: ${a.shortSummary}\n   Reason: ${a.reasonTags.join(", ")}`,
    )
    .join("\n\n");

  return `You are a technical content curator. Given the following articles from this week, produce a weekly digest summary.

## Articles (sorted by score, highest first)
${articleList}

## Instructions
Produce a JSON object with:
- "summary_text": A 2-4 sentence summary of this week's articles in Japanese. Mention the most common topics and highlight particularly valuable articles.
- "highlighted_topics": 3-5 topic strings that were most prominent this week (considering both frequency and high-scoring articles).

Return ONLY valid JSON, no markdown fences.`;
}

export async function generateWeeklySummary(weekKey?: string): Promise<void> {
  const weekInfo = weekKey ? getWeekInfoFromKey(weekKey) : getCurrentWeekInfo();

  const articles = await gatherWeekArticles(
    weekInfo.startDate,
    weekInfo.endDate,
  );

  if (articles.length === 0) {
    console.log(`No processed articles found for week ${weekInfo.weekKey}`);
    return;
  }

  // Check if regeneration is needed
  const existing = await prisma.weeklyDigestCache.findUnique({
    where: { weekKey: weekInfo.weekKey },
  });
  if (existing && existing.sourceArticleCount === articles.length) {
    console.log(
      `Weekly summary for ${weekInfo.weekKey} is up to date (${articles.length} articles)`,
    );
    return;
  }

  console.log(
    `Generating weekly summary for ${weekInfo.weekKey} (${articles.length} articles)...`,
  );

  const prompt = buildWeeklyPrompt(articles);
  const response = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    temperature: 0.3,
  });

  const raw = response.choices[0]?.message?.content;
  if (!raw) throw new Error("Empty LLM response for weekly summary");

  const parsed = WeeklyLLMResultSchema.parse(JSON.parse(raw));

  await prisma.weeklyDigestCache.upsert({
    where: { weekKey: weekInfo.weekKey },
    update: {
      weekTitle: weekInfo.title,
      summaryText: parsed.summary_text,
      highlightedTopicsJson: JSON.stringify(parsed.highlighted_topics),
      sourceArticleCount: articles.length,
      generatedAt: new Date(),
    },
    create: {
      weekKey: weekInfo.weekKey,
      weekTitle: weekInfo.title,
      weekStartDate: weekInfo.startDate,
      weekEndDate: weekInfo.endDate,
      summaryText: parsed.summary_text,
      highlightedTopicsJson: JSON.stringify(parsed.highlighted_topics),
      sourceArticleCount: articles.length,
    },
  });

  console.log(`Weekly summary saved for ${weekInfo.weekKey}`);
}
