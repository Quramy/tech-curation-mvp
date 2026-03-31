import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

const feeds = [
  {
    name: "web.dev Blog",
    url: "https://web.dev/blog/feed.xml",
    type: "rss",
  },
  {
    name: "Chrome for Developers Blog",
    url: "https://developer.chrome.com/blog/feed.xml",
    type: "rss",
  },
  {
    name: "Vercel Blog",
    url: "https://vercel.com/atom",
    type: "atom",
  },
  {
    name: "Next.js Blog",
    url: "https://nextjs.org/blog/rss.xml",
    type: "rss",
  },
  {
    name: "React Blog",
    url: "https://react.dev/rss.xml",
    type: "rss",
  },
  {
    name: "TypeScript Blog",
    url: "https://devblogs.microsoft.com/typescript/feed",
    type: "rss",
  },
];

const userProfile = {
  profileSummary:
    "フロントエンド全般、とくに React / Next.js / TypeScript / Storybook / テスト基盤への関心が強い。具体的な実装、設計判断、ツールの内部挙動、ブラウザ仕様差分、運用上の制約を扱う記事を好む。Web 標準仕様や新しい JavaScript / CSS 仕様にも関心がある。AI 関連では、流行紹介よりも UI 実装・検証ワークフローにどう組み込むかを扱う記事を優先する。",
  interestsJson: JSON.stringify([
    "Frontend Engineering",
    "React",
    "Next.js / RSC",
    "TypeScript",
    "Storybook",
    "Testing / VRT / Vitest / Jest",
    "Browser APIs / Web Platform",
    "Web Standards",
    "JavaScript Features",
    "CSS Features",
    "Accessibility",
    "Performance",
    "AI Agent for UI workflows",
    "Node.js Tooling",
    "Build / CI / DX",
  ]),
  preferredArticleTypesJson: JSON.stringify([
    "具体的な実装の解説",
    "設計判断の議論",
    "ツールの内部挙動の深掘り",
    "ブラウザ仕様差分の調査",
    "運用上の制約と対策",
    "新しい Web 標準仕様の解説",
  ]),
  deprioritizedArticleTypesJson: JSON.stringify([
    "採用広報",
    "入門まとめ",
    "告知だけの記事",
    "実装詳細のないトレンドまとめ",
    "マーケティング色の強い記事",
  ]),
};

async function main() {
  console.log("Seeding feeds...");
  for (const feed of feeds) {
    await prisma.feed.upsert({
      where: { url: feed.url },
      update: feed,
      create: feed,
    });
  }
  console.log(`Seeded ${feeds.length} feeds`);

  console.log("Seeding user profile...");
  const existing = await prisma.userProfile.findFirst();
  if (existing) {
    await prisma.userProfile.update({
      where: { id: existing.id },
      data: userProfile,
    });
  } else {
    await prisma.userProfile.create({ data: userProfile });
  }
  console.log("Seeded user profile");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
