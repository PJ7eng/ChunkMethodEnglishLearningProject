-- Persist reviewable linguistic metadata, structured examples, and generation usage.
ALTER TABLE "Chunk"
  ADD COLUMN "phraseKey" TEXT,
  ADD COLUMN "usage" TEXT,
  ADD COLUMN "register" TEXT,
  ADD COLUMN "cefr" TEXT;

UPDATE "Chunk"
SET "phraseKey" = lower(regexp_replace(trim("phrase"), '\s+', ' ', 'g'));

DO $$
BEGIN
  IF EXISTS (
    SELECT "phraseKey"
    FROM "Chunk"
    GROUP BY "phraseKey"
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Cannot enforce normalized phrase uniqueness: duplicate phrases exist';
  END IF;
END $$;

ALTER TABLE "Chunk" ALTER COLUMN "phraseKey" SET NOT NULL;
CREATE UNIQUE INDEX "Chunk_phraseKey_key" ON "Chunk"("phraseKey");

ALTER TABLE "ChunkExample"
  ADD COLUMN "translation" TEXT,
  ADD COLUMN "orderIndex" INTEGER NOT NULL DEFAULT 0;

WITH ranked AS (
  SELECT "id", row_number() OVER (
    PARTITION BY "chunkId"
    ORDER BY "id"
  ) - 1 AS position
  FROM "ChunkExample"
)
UPDATE "ChunkExample"
SET "orderIndex" = ranked.position
FROM ranked
WHERE "ChunkExample"."id" = ranked."id";

CREATE UNIQUE INDEX "ChunkExample_chunkId_orderIndex_key"
  ON "ChunkExample"("chunkId", "orderIndex");

ALTER TABLE "GenerationJob"
  ADD COLUMN "provider" TEXT,
  ADD COLUMN "retryCount" INTEGER NOT NULL DEFAULT 0;

UPDATE "GenerationJob"
SET "provider" = 'openai'
WHERE "model" IS NOT NULL AND "provider" IS NULL;
