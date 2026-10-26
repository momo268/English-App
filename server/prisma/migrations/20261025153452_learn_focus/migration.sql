-- AlterTable
ALTER TABLE "CourseRecord" ADD COLUMN     "lastStudiedAt" TIMESTAMP(3),
ADD COLUMN     "lastWordIndex" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "WordBookRecord" ADD COLUMN     "correctCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "ease" DOUBLE PRECISION NOT NULL DEFAULT 2.5,
ADD COLUMN     "intervalDays" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lastReviewedAt" TIMESTAMP(3),
ADD COLUMN     "mastery" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "nextReviewAt" TIMESTAMP(3),
ADD COLUMN     "repetitions" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "wrongCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "PracticeLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "wordId" TEXT NOT NULL,
    "courseId" TEXT,
    "mode" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    "revealed" BOOLEAN NOT NULL DEFAULT false,
    "answer" TEXT,
    "expected" TEXT,
    "durationMs" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PracticeLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PracticeLog_userId_createdAt_idx" ON "PracticeLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "PracticeLog_userId_wordId_idx" ON "PracticeLog"("userId", "wordId");

-- CreateIndex
CREATE INDEX "PracticeLog_userId_courseId_idx" ON "PracticeLog"("userId", "courseId");

-- CreateIndex
CREATE INDEX "WordBookRecord_userId_nextReviewAt_idx" ON "WordBookRecord"("userId", "nextReviewAt");
