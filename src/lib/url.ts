const TRACKING_PARAMS = new Set([
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "ref",
  "source",
  "fbclid",
  "gclid",
]);

/**
 * URL を正規化する（重複判定用）
 * - trailing slash を除去
 * - ホスト名を小文字化
 * - トラッキング系クエリパラメータを除去
 * - 残りのクエリパラメータをソート
 * - フラグメントを除去
 */
export function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);

    // ホスト名を小文字化
    parsed.hostname = parsed.hostname.toLowerCase();

    // フラグメント除去
    parsed.hash = "";

    // トラッキング系パラメータを除去
    for (const key of [...parsed.searchParams.keys()]) {
      if (TRACKING_PARAMS.has(key.toLowerCase())) {
        parsed.searchParams.delete(key);
      }
    }

    // 残りのパラメータをソート
    parsed.searchParams.sort();

    let normalized = parsed.toString();

    // trailing slash を除去（パスが "/" のみの場合は除く）
    if (normalized.endsWith("/") && parsed.pathname !== "/") {
      normalized = normalized.slice(0, -1);
    }

    return normalized;
  } catch {
    // パースできない場合はそのまま返す
    return url;
  }
}
