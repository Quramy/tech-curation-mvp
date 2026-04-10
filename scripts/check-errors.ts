import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({
  adapter: new PrismaPg(process.env.DATABASE_URL!),
});

async function main() {
  const articles = await prisma.article.findMany({
    where: { status: "failed" },
    select: { title: true, errorMessage: true },
    take: 3,
  });
  for (const a of articles) {
    console.log(a.title);
    console.log("  ->", a.errorMessage);
    console.log();
  }
}

main()
  .then(() => prisma.$disconnect())
  .then(() => process.exit(0));
