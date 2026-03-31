-- CreateTable
CREATE TABLE "feeds" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'rss',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feeds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "articles" (
    "id" TEXT NOT NULL,
    "feed_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "published_at" TIMESTAMP(3),
    "fetched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "author_name" TEXT,
    "content_text" TEXT,
    "content_html" TEXT,
    "og_image_url" TEXT,
    "status" TEXT NOT NULL DEFAULT 'fetched',
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "articles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "article_summaries" (
    "id" TEXT NOT NULL,
    "article_id" TEXT NOT NULL,
    "short_summary" TEXT NOT NULL,
    "medium_summary" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "article_summaries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "article_topics" (
    "id" TEXT NOT NULL,
    "article_id" TEXT NOT NULL,
    "topic" TEXT NOT NULL,

    CONSTRAINT "article_topics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "article_scores" (
    "id" TEXT NOT NULL,
    "article_id" TEXT NOT NULL,
    "total_score" INTEGER NOT NULL,
    "layer1_score" INTEGER NOT NULL,
    "layer2_score" INTEGER NOT NULL,
    "reason_tags" TEXT NOT NULL,
    "short_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "article_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_profile" (
    "id" TEXT NOT NULL,
    "profile_summary" TEXT NOT NULL,
    "interests_json" TEXT NOT NULL,
    "preferred_article_types_json" TEXT NOT NULL,
    "deprioritized_article_types_json" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weekly_digest_cache" (
    "id" TEXT NOT NULL,
    "week_key" TEXT NOT NULL,
    "week_title" TEXT NOT NULL,
    "week_start_date" TIMESTAMP(3) NOT NULL,
    "week_end_date" TIMESTAMP(3) NOT NULL,
    "summary_text" TEXT NOT NULL,
    "highlighted_topics_json" TEXT NOT NULL,
    "source_article_count" INTEGER NOT NULL,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "weekly_digest_cache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "articles_url_key" ON "articles"("url");

-- CreateIndex
CREATE UNIQUE INDEX "article_summaries_article_id_key" ON "article_summaries"("article_id");

-- CreateIndex
CREATE INDEX "article_topics_article_id_idx" ON "article_topics"("article_id");

-- CreateIndex
CREATE UNIQUE INDEX "article_scores_article_id_key" ON "article_scores"("article_id");

-- CreateIndex
CREATE UNIQUE INDEX "weekly_digest_cache_week_key_key" ON "weekly_digest_cache"("week_key");

-- AddForeignKey
ALTER TABLE "articles" ADD CONSTRAINT "articles_feed_id_fkey" FOREIGN KEY ("feed_id") REFERENCES "feeds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article_summaries" ADD CONSTRAINT "article_summaries_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article_topics" ADD CONSTRAINT "article_topics_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article_scores" ADD CONSTRAINT "article_scores_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
