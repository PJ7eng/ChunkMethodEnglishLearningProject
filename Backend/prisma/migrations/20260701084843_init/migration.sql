-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('draft', 'generating', 'pending_review', 'published', 'retired');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('pending', 'running', 'success', 'failed');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dailyGoal" INTEGER NOT NULL DEFAULT 10,
    "soundEnabled" BOOLEAN NOT NULL DEFAULT true,
    "reminderEnabled" BOOLEAN NOT NULL DEFAULT false,
    "hapticEnabled" BOOLEAN NOT NULL DEFAULT true,
    "autoNextEnabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "UserPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentPoolItem" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'draft',
    "qualityScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentPoolItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Chunk" (
    "id" TEXT NOT NULL,
    "contentPoolItemId" TEXT NOT NULL,
    "phrase" TEXT NOT NULL,
    "translation" TEXT NOT NULL,
    "pinyin" TEXT,
    "category" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "blank" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "options" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',

    CONSTRAINT "Chunk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChunkExample" (
    "id" TEXT NOT NULL,
    "chunkId" TEXT NOT NULL,
    "sentence" TEXT NOT NULL,

    CONSTRAINT "ChunkExample_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuizQuestion" (
    "id" TEXT NOT NULL,
    "contentPoolItemId" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "correctAnswerChunkId" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',

    CONSTRAINT "QuizQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuizOption" (
    "id" TEXT NOT NULL,
    "quizQuestionId" TEXT NOT NULL,
    "chunkId" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    "orderIndex" INTEGER NOT NULL,

    CONSTRAINT "QuizOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "chunkId" TEXT NOT NULL,
    "mastered" BOOLEAN NOT NULL DEFAULT false,
    "needsReview" BOOLEAN NOT NULL DEFAULT false,
    "lastReviewedAt" TIMESTAMP(3),
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "answerCount" INTEGER NOT NULL DEFAULT 0,
    "masteryScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,

    CONSTRAINT "LearningProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedCount" INTEGER NOT NULL DEFAULT 0,
    "goal" INTEGER NOT NULL,
    "streakDay" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "DailyProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GenerationJob" (
    "id" TEXT NOT NULL,
    "jobType" TEXT NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'pending',
    "batchSize" INTEGER NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "triggerReason" TEXT NOT NULL,

    CONSTRAINT "GenerationJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "UserPreference_userId_key" ON "UserPreference"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Chunk_phrase_key" ON "Chunk"("phrase");

-- CreateIndex
CREATE UNIQUE INDEX "LearningProgress_userId_chunkId_key" ON "LearningProgress"("userId", "chunkId");

-- CreateIndex
CREATE UNIQUE INDEX "DailyProgress_userId_date_key" ON "DailyProgress"("userId", "date");

-- AddForeignKey
ALTER TABLE "UserPreference" ADD CONSTRAINT "UserPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chunk" ADD CONSTRAINT "Chunk_contentPoolItemId_fkey" FOREIGN KEY ("contentPoolItemId") REFERENCES "ContentPoolItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChunkExample" ADD CONSTRAINT "ChunkExample_chunkId_fkey" FOREIGN KEY ("chunkId") REFERENCES "Chunk"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizQuestion" ADD CONSTRAINT "QuizQuestion_contentPoolItemId_fkey" FOREIGN KEY ("contentPoolItemId") REFERENCES "ContentPoolItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizOption" ADD CONSTRAINT "QuizOption_quizQuestionId_fkey" FOREIGN KEY ("quizQuestionId") REFERENCES "QuizQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizOption" ADD CONSTRAINT "QuizOption_chunkId_fkey" FOREIGN KEY ("chunkId") REFERENCES "Chunk"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningProgress" ADD CONSTRAINT "LearningProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningProgress" ADD CONSTRAINT "LearningProgress_chunkId_fkey" FOREIGN KEY ("chunkId") REFERENCES "Chunk"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyProgress" ADD CONSTRAINT "DailyProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
