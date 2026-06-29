"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "../lib/prisma";

// エクスポート JSON のスキーマバージョン（<Major>.<Minor>）。
// 破壊的変更時に Major を、後方互換な追加時に Minor を上げる。
const SCHEMA_VERSION = "1.0";

const ExportableFeedSchema = z.object({
  name: z.string().min(1),
  url: z.url(),
  type: z.enum(["rss", "atom"]).default("rss"),
  isActive: z.boolean().default(true),
});

const FeedsExportSchema = z.object({
  version: z
    .string()
    .regex(/^\d+\.\d+$/, "version は <Major>.<Minor> 形式である必要があります"),
  feeds: z.array(ExportableFeedSchema),
});

export async function getFeeds() {
  return prisma.feed.findMany({ orderBy: { createdAt: "asc" } });
}

export async function addFeed(formData: FormData) {
  const name = formData.get("name") as string;
  const url = formData.get("url") as string;
  const type = (formData.get("type") as string) || "rss";

  if (!name || !url) {
    throw new Error("name and url are required");
  }

  await prisma.feed.create({ data: { name, url, type } });
  revalidatePath("/feeds");
}

export async function deleteFeed(feedId: string) {
  await prisma.feed.delete({ where: { id: feedId } });
  revalidatePath("/feeds");
}

export async function toggleFeedActive(feedId: string) {
  const feed = await prisma.feed.findUniqueOrThrow({
    where: { id: feedId },
  });
  await prisma.feed.update({
    where: { id: feedId },
    data: { isActive: !feed.isActive },
  });
  revalidatePath("/feeds");
}

export async function exportFeeds(): Promise<string> {
  const feeds = await prisma.feed.findMany({ orderBy: { createdAt: "asc" } });
  const payload = {
    version: SCHEMA_VERSION,
    feeds: feeds.map((feed) => ({
      name: feed.name,
      url: feed.url,
      type: feed.type,
      isActive: feed.isActive,
    })),
  };
  return JSON.stringify(payload, null, 2);
}

export async function importFeeds(
  jsonText: string,
): Promise<{ created: number; updated: number }> {
  let raw: unknown;
  try {
    raw = JSON.parse(jsonText);
  } catch {
    throw new Error(
      "JSON の解析に失敗しました。ファイル内容を確認してください。",
    );
  }

  const parsed = FeedsExportSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(
      `インポートデータの形式が不正です: ${parsed.error.issues[0]?.message ?? "unknown"}`,
    );
  }

  // version の Major 部分のみ一致確認（Minor 違いは後方互換として許容）。
  const currentMajor = SCHEMA_VERSION.split(".")[0];
  const importMajor = parsed.data.version.split(".")[0];
  if (importMajor !== currentMajor) {
    throw new Error(
      `互換性のないバージョンです（期待: ${currentMajor}.x, 実際: ${parsed.data.version}）`,
    );
  }

  const feeds = parsed.data.feeds;
  const existingUrls = new Set(
    (
      await prisma.feed.findMany({
        where: { url: { in: feeds.map((f) => f.url) } },
        select: { url: true },
      })
    ).map((f) => f.url),
  );

  await prisma.$transaction(
    feeds.map((feed) =>
      prisma.feed.upsert({
        where: { url: feed.url },
        update: { name: feed.name, type: feed.type, isActive: feed.isActive },
        create: {
          name: feed.name,
          url: feed.url,
          type: feed.type,
          isActive: feed.isActive,
        },
      }),
    ),
  );

  revalidatePath("/feeds");

  const updated = feeds.filter((f) => existingUrls.has(f.url)).length;
  return { created: feeds.length - updated, updated };
}
