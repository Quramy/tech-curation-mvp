import type { Topic } from "./topics";

export type ArticleStatus = "fetched" | "extracted" | "processed" | "failed";

export type WeekInfo = {
  weekKey: string;
  title: string;
  dateRange: string;
  startDate: Date;
  endDate: Date;
};

export type ScoreResult = {
  totalScore: number;
  layer1Score: number;
  layer2Score: number;
  reasonTags: string[];
  shortReason: string | null;
};

export type LLMArticleResult = {
  short_summary: string;
  medium_summary: string;
  topics: Topic[];
  layer1_score: number;
  layer2_score: number;
  total_score: number;
  reason_tags: string[];
  short_reason: string;
};
