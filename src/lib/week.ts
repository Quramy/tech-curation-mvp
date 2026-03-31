import {
  startOfWeek,
  endOfWeek,
  subWeeks,
  getISOWeek,
  getISOWeekYear,
  format,
  getMonth,
  getDate,
} from "date-fns";
import type { WeekInfo } from "./types";

/**
 * 月曜始まりの週開始日を取得
 */
function getWeekStart(date: Date): Date {
  return startOfWeek(date, { weekStartsOn: 1 });
}

/**
 * 月曜始まりの週終了日(日曜)を取得
 */
function getWeekEnd(date: Date): Date {
  return endOfWeek(date, { weekStartsOn: 1 });
}

/**
 * ISO 週番号ベースの week_key を返す (例: "2026-W14")
 */
export function getWeekKey(date: Date): string {
  const year = getISOWeekYear(date);
  const week = getISOWeek(date);
  return `${year}-W${String(week).padStart(2, "0")}`;
}

/**
 * 日本語の週タイトルを返す (例: "2026年3月第4週")
 */
export function getWeekTitle(date: Date): string {
  const monday = getWeekStart(date);
  const year = monday.getFullYear();
  const month = getMonth(monday) + 1;

  // その月の第何週かを計算（月曜日の日付ベース）
  const day = getDate(monday);
  const weekOfMonth = Math.ceil(day / 7);

  return `${year}年${month}月第${weekOfMonth}週`;
}

/**
 * 日付範囲文字列を返す (例: "2026/03/23 - 2026/03/29")
 */
export function getWeekDateRange(date: Date): {
  start: Date;
  end: Date;
  display: string;
} {
  const start = getWeekStart(date);
  const end = getWeekEnd(date);
  const display = `${format(start, "yyyy/MM/dd")} - ${format(end, "yyyy/MM/dd")}`;
  return { start, end, display };
}

/**
 * 指定日の WeekInfo を返す
 */
export function getWeekInfo(date: Date): WeekInfo {
  const weekKey = getWeekKey(date);
  const title = getWeekTitle(date);
  const { start, end, display } = getWeekDateRange(date);
  return { weekKey, title, dateRange: display, startDate: start, endDate: end };
}

/**
 * 現在週の WeekInfo を返す
 */
export function getCurrentWeekInfo(): WeekInfo {
  return getWeekInfo(new Date());
}

/**
 * 先週の WeekInfo を返す
 */
export function getPreviousWeekInfo(): WeekInfo {
  return getWeekInfo(subWeeks(new Date(), 1));
}

/**
 * weekKey (e.g. "2026-W14") から WeekInfo を復元する
 */
export function getWeekInfoFromKey(weekKey: string): WeekInfo {
  const match = weekKey.match(/^(\d{4})-W(\d{2})$/);
  if (!match) throw new Error(`Invalid weekKey: ${weekKey}`);

  const year = Number.parseInt(match[1]);
  const week = Number.parseInt(match[2]);

  // ISO week 1 の月曜日を求め、そこから (week - 1) 週足す
  const jan4 = new Date(year, 0, 4);
  const dayOfWeek = jan4.getDay() || 7; // 日曜=7
  const monday = new Date(jan4);
  monday.setDate(jan4.getDate() - dayOfWeek + 1 + (week - 1) * 7);

  return getWeekInfo(monday);
}

/**
 * 週の範囲で記事をフィルタするための Prisma where 条件を返す。
 * publishedAt がある場合はそれを、ない場合は fetchedAt をフォールバックに使う。
 */
export function weekArticleFilter(weekInfo: WeekInfo) {
  return {
    OR: [
      { publishedAt: { gte: weekInfo.startDate, lt: weekInfo.endDate } },
      {
        publishedAt: null,
        fetchedAt: { gte: weekInfo.startDate, lt: weekInfo.endDate },
      },
    ],
  };
}
