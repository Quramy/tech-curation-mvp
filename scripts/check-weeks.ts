import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { getWeekKey } from "../src/lib/week";

const prisma = new PrismaClient({ adapter: new PrismaPg(process.env.DATABASE_URL!) });

async function main() {
  const articles = await prisma.article.findMany({
    where: { status: "processed" },
    select: { title: true, publishedAt: true, fetchedAt: true },
    orderBy: { publishedAt: "desc" },
    take: 10,
  });
  for (const a of articles) {
    const date = a.publishedAt || a.fetchedAt;
    const wk = getWeekKey(date);
    console.log(`${wk}  ${date.toISOString().slice(0, 10)}  ${a.title}`);
  }
}

main()
  .then(() => prisma.$disconnect())
  .then(() => process.exit(0));
