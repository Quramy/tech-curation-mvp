import "dotenv/config";
import { collectAllFeeds } from "../src/services/collector";
import { extractAllPending } from "../src/services/extractor";
import { processAllPending } from "../src/services/articleProcessor";
import { generateWeeklySummary } from "../src/services/weeklyProcessor";
import { prisma } from "../src/lib/prisma";
import {
  getPreviousWeekInfo,
  getWeekInfoFromKey,
  weekArticleFilter,
} from "../src/lib/week";

const command = process.argv[2];
const weekKeyArg = process.argv[3]; // optional: e.g. "2026-W13"

function resolveWeekKey(): string {
  if (weekKeyArg) return weekKeyArg;
  return getPreviousWeekInfo().weekKey;
}

async function main() {
  const weekKey = resolveWeekKey();

  switch (command) {
    case "collect": {
      console.log("Starting article collection...");
      const results = await collectAllFeeds();
      const totalCollected = results.reduce((s, r) => s + r.collected, 0);
      const totalSkipped = results.reduce((s, r) => s + r.skipped, 0);
      console.log(
        `\nDone. Collected: ${totalCollected}, Skipped: ${totalSkipped}`,
      );
      break;
    }
    case "extract": {
      console.log(`Starting content extraction for ${weekKey}...`);
      const result = await extractAllPending(weekKey);
      console.log(
        `\nDone. Extracted: ${result.extracted}, Failed: ${result.failed}`,
      );
      break;
    }
    case "process-articles": {
      console.log(`Starting article LLM processing for ${weekKey}...`);
      const processResult = await processAllPending(weekKey);
      console.log(
        `\nDone. Processed: ${processResult.processed}, Failed: ${processResult.failed}`,
      );
      break;
    }
    case "process-weekly": {
      console.log(
        `Starting weekly summary generation for ${weekKey}...`,
      );
      await generateWeeklySummary(weekKey);
      console.log("\nDone.");
      break;
    }
    case "all": {
      console.log(`=== Running full pipeline for ${weekKey} ===\n`);

      console.log("1. Collecting articles...");
      const allCollectResults = await collectAllFeeds();
      const totalCollectedAll = allCollectResults.reduce(
        (s, r) => s + r.collected,
        0,
      );
      console.log(`   Collected: ${totalCollectedAll}\n`);

      console.log(`2. Extracting content (${weekKey})...`);
      const allExtractResult = await extractAllPending(weekKey);
      console.log(`   Extracted: ${allExtractResult.extracted}\n`);

      console.log(`3. Processing articles with LLM (${weekKey})...`);
      const allProcessResult = await processAllPending(weekKey);
      console.log(`   Processed: ${allProcessResult.processed}\n`);

      console.log(`4. Generating weekly summary (${weekKey})...`);
      await generateWeeklySummary(weekKey);
      console.log("\n=== Pipeline complete ===");
      break;
    }
    case "retry": {
      const weekInfo = getWeekInfoFromKey(weekKey);
      const filter = weekArticleFilter(weekInfo);
      console.log(`Retrying failed articles for ${weekKey}...`);
      const failedWithContent = await prisma.article.updateMany({
        where: { status: "failed", contentText: { not: null }, ...filter },
        data: { status: "extracted", errorMessage: null },
      });
      const failedWithoutContent = await prisma.article.updateMany({
        where: { status: "failed", contentText: null, ...filter },
        data: { status: "fetched", errorMessage: null },
      });
      console.log(
        `Reset ${failedWithContent.count + failedWithoutContent.count} failed articles`,
      );

      const retryExtract = await extractAllPending(weekKey);
      console.log(`Extracted: ${retryExtract.extracted}`);
      const retryProcess = await processAllPending(weekKey);
      console.log(`Processed: ${retryProcess.processed}`);
      console.log("\nDone.");
      break;
    }
    case "status": {
      const weekInfo = getWeekInfoFromKey(weekKey);
      const filter = weekArticleFilter(weekInfo);
      const [fetched, extracted, processed, failed] = await Promise.all([
        prisma.article.count({ where: { status: "fetched", ...filter } }),
        prisma.article.count({ where: { status: "extracted", ...filter } }),
        prisma.article.count({ where: { status: "processed", ...filter } }),
        prisma.article.count({ where: { status: "failed", ...filter } }),
      ]);
      const total = fetched + extracted + processed + failed;
      console.log(`Pipeline Status (${weekKey}):`);
      console.log(`  Total:     ${total}`);
      console.log(`  Fetched:   ${fetched}`);
      console.log(`  Extracted: ${extracted}`);
      console.log(`  Processed: ${processed}`);
      console.log(`  Failed:    ${failed}`);
      break;
    }
    default:
      console.log(
        "Usage: tsx scripts/pipeline.ts <collect|extract|process-articles|process-weekly|all|retry|status> [weekKey]",
      );
      process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
