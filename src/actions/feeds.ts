"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "../lib/prisma";

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
