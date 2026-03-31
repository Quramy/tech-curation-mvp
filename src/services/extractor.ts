import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";
import { prisma } from "../lib/prisma";
import { weekArticleFilter, getCurrentWeekInfo, getWeekInfoFromKey } from "../lib/week";

type ExtractedContent = {
  title: string | null;
  contentText: string | null;
  contentHtml: string | null;
  ogImageUrl: string | null;
};

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; TechDigestBot/1.0; +https://github.com)",
    },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText}`);
  }
  return res.text();
}

function extractOgImage(doc: Document): string | null {
  const meta = doc.querySelector('meta[property="og:image"]');
  return meta?.getAttribute("content") || null;
}

function extractContent(html: string, url: string): ExtractedContent {
  const dom = new JSDOM(html, { url });
  const doc = dom.window.document;

  const ogImageUrl = extractOgImage(doc);

  const reader = new Readability(doc);
  const article = reader.parse();

  return {
    title: article?.title || null,
    contentText: article?.textContent || null,
    contentHtml: article?.content || null,
    ogImageUrl,
  };
}

export async function extractSingleArticle(
  articleId: string,
): Promise<boolean> {
  const article = await prisma.article.findUniqueOrThrow({
    where: { id: articleId },
  });

  try {
    const html = await fetchHtml(article.url);
    const extracted = extractContent(html, article.url);

    await prisma.article.update({
      where: { id: articleId },
      data: {
        title: extracted.title || article.title,
        contentText: extracted.contentText,
        contentHtml: extracted.contentHtml,
        ogImageUrl: extracted.ogImageUrl,
        status: "extracted",
        errorMessage: null,
      },
    });
    return true;
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    await prisma.article.update({
      where: { id: articleId },
      data: {
        status: "failed",
        errorMessage: `Extraction failed: ${message}`,
      },
    });
    return false;
  }
}

export async function extractAllPending(weekKey?: string): Promise<{
  extracted: number;
  failed: number;
}> {
  const weekInfo = weekKey ? getWeekInfoFromKey(weekKey) : getCurrentWeekInfo();
  const articles = await prisma.article.findMany({
    where: { status: "fetched", ...weekArticleFilter(weekInfo) },
    select: { id: true, title: true, url: true },
  });

  let extracted = 0;
  let failed = 0;

  for (const article of articles) {
    console.log(`Extracting: ${article.title}`);
    const success = await extractSingleArticle(article.id);
    if (success) {
      extracted++;
    } else {
      failed++;
    }
    // サーバーへの負荷軽減
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  return { extracted, failed };
}
