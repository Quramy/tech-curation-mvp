# Tech Curation - 技術ブログ週次ダイジェスト

技術ブログの記事を自動収集し、要約・スコアリングして週単位のダイジェストとして閲覧できる Web アプリ。

## セットアップ

### 前提条件

- Node.js 20.9+
- Docker (PostgreSQL 用)
- OpenAI API キー

### 初期セットアップ

```bash
npm install

# .env を作成して API キーを設定
cp .env.example .env
# OPENAI_API_KEY を編集

# PostgreSQL 起動 + マイグレーション + 初期データ投入
npm run db:setup
```

### 開発サーバー起動

```bash
npm run dev
```

- http://localhost:3000/ - 週次ダイジェスト画面
- http://localhost:3000/feeds - フィード管理画面

## パイプライン

記事の処理は 4 段階のパイプラインで行われます。

```
収集 (collect) → 本文抽出 (extract) → LLM 処理 (process) → 週サマリー生成 (weekly)
```

### CLI から実行

```bash
npm run pipeline:all          # 全段一括実行
npm run pipeline:collect      # RSS 収集のみ
npm run pipeline:extract      # 本文抽出のみ
npm run pipeline:process      # 記事単位 LLM 処理のみ
npm run pipeline:weekly       # 週サマリー生成のみ
npm run pipeline:retry        # 失敗した記事をリトライ
npm run pipeline:status       # 処理状況を表示
```

週サマリーは特定の週を指定して生成することもできます。

```bash
npx tsx scripts/pipeline.ts process-weekly 2026-W13
```

### UI から実行

ダイジェスト画面のボタンからも各段階を実行できます。

## 技術スタック

- **フロントエンド**: Next.js 16, CSS Modules
- **バックエンド**: Next.js Server Actions, Prisma
- **データベース**: PostgreSQL (Docker)
- **LLM**: OpenAI API

## 環境変数

| 変数 | 説明 | デフォルト |
|------|------|-----------|
| `DATABASE_URL` | PostgreSQL 接続文字列 | - |
| `OPENAI_API_KEY` | OpenAI API キー | - |
| `OPENAI_MODEL` | 使用する OpenAI モデル | `gpt-4o-mini` |
