# 技術ブログ週次ダイジェストアプリ 実装タスク一覧

## 0. 前提

- フロントエンド: Next.js, CSS Modules
- バックエンド: Next.js Server Actions
- ORM: Prisma
- DB: PostgreSQL
- LLM: OpenAI

---

## 1. プロジェクト初期セットアップ

### 1.1 Next.js プロジェクト作成
- Next.js アプリを作成する
- App Router 構成にする
- TypeScript を有効化する
- ESLint / Prettier を整備する

### 1.2 CSS Modules 設定
- CSS Modules ベースでスタイリングする前提を整える
- 共通レイアウト用のスタイル設計方針を決める

### 1.3 Prisma / Postgres 接続
- Docker Compose で PostgreSQL 環境を用意する
- Prisma を導入する
- PostgreSQL への接続設定を行う
- `.env` に DB 接続文字列を設定する
- Prisma Client を初期化する

### 1.4 OpenAI 接続設定
- OpenAI API キーを `.env` に設定する
- サーバー側から呼び出せる LLM クライアントを用意する

---

## 2. データモデル実装

### 2.1 Prisma スキーマ定義
以下のモデルを定義する。

- `Feed`
- `Article`
- `ArticleSummary`
- `ArticleTopic`
- `ArticleScore`
- `UserProfile`
- `WeeklyDigestCache`

### 2.2 マイグレーション作成
- Prisma migration を作成する
- DB に反映する

### 2.3 初期データ投入の仕組み
- feed を初期投入できる seed を用意する
- user_profile の初期投入手段を用意する

---

## 3. ドメイン型・ユーティリティ整備

### 3.1 ドメイン型定義
- Article の処理状態を表す型を定義する
- 週を表す型を定義する
- スコア関連の型を定義する
- トピック候補の enum / 定数を定義する

### 3.2 週計算ユーティリティ
- 月曜始まりで週を計算する関数を作る
- `published_at` から `week_key` を求める関数を作る
- 表示用タイトル（例: `2026年3月第4週`）を作る関数を作る
- 日付範囲文字列（例: `2026/03/23 - 2026/03/29`）を作る関数を作る

### 3.3 URL 正規化ユーティリティ
- trailing slash を吸収する
- 不要な query parameter を落とす
- 重複判定用の正規化関数を作る

---

## 4. Feed 管理機能

### 4.1 feed 一覧取得
- DB から active な feed を取得する処理を作る

### 4.2 feed 登録
- feed を追加する Server Action を作る

### 4.3 feed 更新
- feed の有効 / 無効切り替えを行う Server Action を作る

### 4.4 feed 削除
- 必要であれば feed 削除機能を作る
- MVP では削除を後回しにしてもよい

---

## 5. 記事収集機能

### 5.1 RSS / Atom 取得
- feed URL から RSS / Atom を取得する処理を作る
- entry 一覧を解析する

### 5.2 記事候補の抽出
各 entry から最低限以下を抽出する。

- title
- url
- published_at
- author
- source/feed

### 5.3 重複判定
- 正規化 URL で既存記事を検索する
- 重複記事を登録しない

### 5.4 Article レコード作成
- 新規 article を `fetched` 相当の状態で保存する

### 5.5 記事収集エントリポイント
- 全 active feed を巡回する実行関数を作る
- 単一 feed だけ収集する実行関数も作る

---

## 6. 本文抽出機能

### 6.1 記事ページ取得
- article URL の HTML を取得する

### 6.2 本文抽出
- readable な本文テキストを抽出する
- cleaned content text を作る
- cleaned content html を作る

### 6.3 メタデータ抽出
- title を再取得できれば再取得する
- og:image を抽出する
- `published_at` の再補完ができれば行う

### 6.4 fallback
- 本文抽出が難しい場合、RSS 側の本文を利用できる余地を残す

### 6.5 DB 更新
- `Article` に本文、OG Image、更新後 title などを保存する
- status を更新する

---

## 7. ユーザープロファイル機能

### 7.1 UserProfile モデル操作
- profile の取得処理を作る
- profile の更新処理を作る

### 7.2 初期プロフィール登録
- 現時点の合意済みプロフィールを seed または初期データとして保存できるようにする

### 7.3 JSON 構造の取り扱い
- interests
- preferred article types
- deprioritized article types
の JSON 構造を安定して扱えるようにする

---

## 8. 記事単位 LLM 処理

### 8.1 LLM プロンプト設計
1回の LLM 呼び出しで以下をまとめて返すプロンプトを作る。

- short summary
- medium summary
- topics
- layer1 score
- layer2 score
- total score
- reason tags
- short reason（任意）

### 8.2 出力フォーマット定義
- JSON 形式で返すようにする
- 型安全に parse できるようにする

### 8.3 Article 単位処理関数
入力:
- article 本文
- article title
- source 名
- user profile

出力:
- ArticleSummary
- ArticleTopic[]
- ArticleScore

### 8.4 DB 保存
- `ArticleSummary`
- `ArticleTopic`
- `ArticleScore`
を保存する

### 8.5 並列処理対応
- 未処理 article をまとめて取得し、並列処理できるようにする
- 過度な同時実行を避けるための concurrency 制御を入れてよい

---

## 9. 週単位 LLM 処理

### 9.1 週単位入力整形
対象週の処理済み記事から以下を集める。

- title
- short summary
- topics
- total score
- reason tags

### 9.2 週サマリー生成プロンプト
以下を生成するプロンプトを作る。

- 週全体の短いサマリー（2〜4文）
- 注目トピック（3〜5個）

### 9.3 WeeklyDigestCache 保存
- `week_key`
- `week_title`
- `week_start_date`
- `week_end_date`
- `summary_text`
- `highlighted_topics_json`
- `source_article_count`
- `generated_at`
を保存する

### 9.4 再生成判定
- cache が存在しない場合は生成する
- 対象週の記事構成が変わった場合は再生成対象にする

---

## 10. 週次ダイジェスト取得ロジック

### 10.1 対象週の記事取得
- `week_key` に属する記事を取得する
- 総合スコア順に並べる

### 10.2 画面表示用 ViewModel 整形
各記事について以下を整形する。

- title
- source name
- published_at
- short summary
- total score
- reason tags
- og image or placeholder
- url

### 10.3 週サマリー取得
- `WeeklyDigestCache` から取得する
- 未生成なら生成して保存する
- 失敗時は記事一覧のみ返せるようにする

---

## 11. フロントエンド実装

### 11.1 アプリ共通レイアウト
- ヘッダ
- メインコンテンツ領域
- 週次ダイジェスト表示レイアウト

### 11.2 週次ダイジェスト画面
表示要素:
- 週タイトル
- 日付範囲
- 週サマリー
- 注目トピック
- 記事一覧

### 11.3 記事カードコンポーネント
表示要素:
- タイトル
- 出典
- 公開日
- short summary
- 総合スコア
- 理由タグ
- OG Image / プレースホルダー

### 11.4 注目トピック表示コンポーネント
- タグ形式で表示する

### 11.5 週切り替え UI
- 今週 / 過去週を切り替えられる最低限の UI を作る
- MVP では一覧選択や prev/next のみでもよい

---

## 12. Feed / Profile 管理画面

### 12.1 feed 管理画面
- feed 一覧表示
- feed 追加
- feed 有効 / 無効切り替え

### 12.2 profile 表示 / 編集画面
- profile summary を表示
- interests を表示
- deprioritized article types を表示
- 必要最低限の編集を可能にするか、MVP では read-only にしてもよい

---

## 13. サムネイル表示仕様

### 13.1 OG Image 表示
- `og_image_url` がある場合に表示する

### 13.2 プレースホルダー
- 画像がない場合のプレースホルダー表示を作る

### 13.3 レイアウト調整
- サムネイルがなくてもカードが破綻しないこと
- サムネイルは補助情報であることを前提にレイアウトする

---

## 14. 実行エントリポイント整備

### 14.1 手動実行用の処理
- feed 収集を手動実行できる
- 未処理 article の LLM 処理を手動実行できる
- 週サマリー再生成を手動実行できる

### 14.2 定期実行の準備
- cron 等から呼びやすい実行関数を分ける
- MVP では外部スケジューラ接続までは必須ではないが、後で繋ぎやすい形にしておく

---

## 15. 基本的な失敗時処理

### 15.1 処理状態管理
最低限、article に処理状態を持たせる。

例:
- fetched
- extracted
- processed
- failed

### 15.2 エラー記録
- エラー内容をログ出力する
- 永続化するなら簡易な error message を保存する

### 15.3 リトライ可能性
- failed article を再処理できるようにする
- スコア生成失敗時のフォールバック表示は行わない

---

## 16. 検証タスク

### 16.1 収集確認
- 複数 feed から記事を取得できるか
- 重複 URL を弾けるか

### 16.2 本文抽出確認
- 技術ブログ記事から本文を安定して抽出できるか
- og:image が取れるか

### 16.3 LLM 出力確認
- 要約が適切か
- topics が固定語彙に収まっているか
- score と reason tags に違和感がないか

### 16.4 週次ダイジェスト確認
- 週タイトルが正しいか
- 週サマリーが妥当か
- 注目トピックが妥当か
- 記事一覧が総合スコア順になっているか

---

## 17. 優先実装順

### Phase 1: 土台
- プロジェクト初期セットアップ
- Prisma / Postgres 接続
- スキーマ定義
- 週計算ユーティリティ
- feed 管理

### Phase 2: 収集
- RSS 取得
- 重複判定
- article 保存
- 手動実行エントリポイント

### Phase 3: 抽出
- 本文抽出
- OG Image 抽出
- article 更新

### Phase 4: LLM（記事単位）
- user profile 保存
- article 単位の LLM 処理
- summary / topics / scores 保存

### Phase 5: LLM（週単位）
- 週単位入力整形
- weekly digest cache 生成
- 再生成ロジック

### Phase 6: UI
- 週次ダイジェスト画面
- 記事カード
- 注目トピック表示
- 週切り替え UI

### Phase 7: 最低限の運用補助
- 手動リトライ
- 失敗状態確認
- 軽い管理画面

---

## 18. 完了条件

以下が揃えば MVP 実装完了とみなす。

- feed を登録できる
- 技術ブログ記事を自動収集できる
- URL 重複排除ができる
- 本文と OG Image を抽出できる
- 記事ごとに要約・トピック・スコア・理由タグが生成される
- 記事がカレンダー週に正しく紐づく
- 週サマリーと注目トピックが生成される
- 週次ダイジェスト画面で一覧表示できる
- 記事が総合スコア順で並ぶ
- サムネイルがある場合は表示し、ない場合はプレースホルダーを表示する
