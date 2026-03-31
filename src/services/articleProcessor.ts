import { z } from "zod";
import { openai } from "../lib/openai";
import { prisma } from "../lib/prisma";
import { weekArticleFilter, getCurrentWeekInfo, getWeekInfoFromKey } from "../lib/week";
import { TOPIC_CANDIDATES } from "../lib/topics";
import type { UserProfile } from "../generated/prisma/client";

const LLMArticleResultSchema = z.object({
  short_summary: z.string(),
  medium_summary: z.string(),
  topics: z.array(z.string()).min(1).max(3),
  layer1_score: z.number().int().min(0).max(100),
  layer2_score: z.number().int().min(0).max(100),
  total_score: z.number().int().min(0).max(100),
  reason_tags: z.array(z.string()).min(2).max(3),
  short_reason: z.string(),
});

function buildPrompt(
  title: string,
  sourceName: string,
  contentText: string,
  profile: UserProfile,
): string {
  const truncatedContent = contentText.slice(0, 6000);
  const topicList = TOPIC_CANDIDATES.join(", ");

  return `You are a technical article analyst. Analyze the following article and produce a structured JSON response.

## User Profile
${profile.profileSummary}

## User Interests
${profile.interestsJson}

## Preferred Article Types
${profile.preferredArticleTypesJson}

## Deprioritized Article Types
${profile.deprioritizedArticleTypesJson}

## Article
Title: ${title}
Source: ${sourceName}

Content:
${truncatedContent}

## Instructions
Produce a JSON object with these fields:
- "short_summary": 1-2 sentence summary in Japanese
- "medium_summary": 3-5 sentence summary in Japanese
- "topics": 1-3 topics from this list ONLY: [${topicList}]
- "layer1_score": 0-100 integer (article intrinsic value: specificity, depth, practicality, novelty)
- "layer2_score": 0-100 integer (match with user profile: topic match, type match, depth match, practical relevance)
- "total_score": 0-100 integer (= round(layer1_score * 0.45 + layer2_score * 0.55))
- "reason_tags": 2-3 short tags explaining the score (in Japanese)
- "short_reason": 1 sentence explaining the score (in Japanese)

## Scoring deductions
Apply score deductions for: recruitment PR, beginner summaries, announcement-only articles, trend summaries without implementation details, marketing-heavy articles.

Return ONLY valid JSON, no markdown fences.`;
}

export async function processArticle(
  articleId: string,
  profile: UserProfile,
): Promise<boolean> {
  const article = await prisma.article.findUniqueOrThrow({
    where: { id: articleId },
    include: { feed: true },
  });

  if (!article.contentText) {
    await prisma.article.update({
      where: { id: articleId },
      data: {
        status: "failed",
        errorMessage: "No content text available for LLM processing",
      },
    });
    return false;
  }

  try {
    const prompt = buildPrompt(
      article.title,
      article.feed.name,
      article.contentText,
      profile,
    );

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const raw = response.choices[0]?.message?.content;
    if (!raw) throw new Error("Empty LLM response");

    const parsed = LLMArticleResultSchema.parse(JSON.parse(raw));

    // Filter topics to only valid candidates
    const validTopics = parsed.topics.filter((t) =>
      (TOPIC_CANDIDATES as readonly string[]).includes(t),
    );

    // Save in a transaction
    await prisma.$transaction(async (tx) => {
      // Upsert summary
      await tx.articleSummary.upsert({
        where: { articleId },
        update: {
          shortSummary: parsed.short_summary,
          mediumSummary: parsed.medium_summary,
        },
        create: {
          articleId,
          shortSummary: parsed.short_summary,
          mediumSummary: parsed.medium_summary,
        },
      });

      // Delete existing topics and recreate
      await tx.articleTopic.deleteMany({ where: { articleId } });
      for (const topic of validTopics) {
        await tx.articleTopic.create({ data: { articleId, topic } });
      }

      // Upsert score
      await tx.articleScore.upsert({
        where: { articleId },
        update: {
          totalScore: parsed.total_score,
          layer1Score: parsed.layer1_score,
          layer2Score: parsed.layer2_score,
          reasonTags: JSON.stringify(parsed.reason_tags),
          shortReason: parsed.short_reason,
        },
        create: {
          articleId,
          totalScore: parsed.total_score,
          layer1Score: parsed.layer1_score,
          layer2Score: parsed.layer2_score,
          reasonTags: JSON.stringify(parsed.reason_tags),
          shortReason: parsed.short_reason,
        },
      });

      // Update article status
      await tx.article.update({
        where: { id: articleId },
        data: { status: "processed", errorMessage: null },
      });
    });

    return true;
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    await prisma.article.update({
      where: { id: articleId },
      data: {
        status: "failed",
        errorMessage: `LLM processing failed: ${message}`,
      },
    });
    return false;
  }
}

export async function processAllPending(
  weekKey?: string,
  concurrency = 3,
): Promise<{ processed: number; failed: number }> {
  const profile = await prisma.userProfile.findFirst();
  if (!profile) {
    throw new Error("User profile not found. Run seed first.");
  }

  const weekInfo = weekKey ? getWeekInfoFromKey(weekKey) : getCurrentWeekInfo();
  const articles = await prisma.article.findMany({
    where: { status: "extracted", ...weekArticleFilter(weekInfo) },
    select: { id: true, title: true },
  });

  let processed = 0;
  let failed = 0;

  // Process in batches
  for (let i = 0; i < articles.length; i += concurrency) {
    const batch = articles.slice(i, i + concurrency);
    const results = await Promise.all(
      batch.map((article) => {
        console.log(`Processing: ${article.title}`);
        return processArticle(article.id, profile);
      }),
    );
    for (const success of results) {
      if (success) processed++;
      else failed++;
    }
  }

  return { processed, failed };
}
