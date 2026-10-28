-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "isCustom" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "ownerId" TEXT,
ADD COLUMN     "wordCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "WordBook" ADD COLUMN     "example" TEXT,
ADD COLUMN     "ownerId" TEXT,
ADD COLUMN     "source" TEXT NOT NULL DEFAULT 'system';

-- CreateTable
CREATE TABLE "UserWordBook" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "wordCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserWordBook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserWordBookItem" (
    "id" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "wordId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "UserWordBookItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseWord" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "wordId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "unit" TEXT,

    CONSTRAINT "CourseWord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportJob" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "fileName" TEXT NOT NULL,
    "targetId" TEXT,
    "total" INTEGER NOT NULL DEFAULT 0,
    "success" INTEGER NOT NULL DEFAULT 0,
    "failed" INTEGER NOT NULL DEFAULT 0,
    "message" TEXT,
    "errors" JSONB,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImportJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserWordBook_userId_updatedAt_idx" ON "UserWordBook"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "UserWordBookItem_wordId_idx" ON "UserWordBookItem"("wordId");

-- CreateIndex
CREATE UNIQUE INDEX "UserWordBookItem_bookId_wordId_key" ON "UserWordBookItem"("bookId", "wordId");

-- CreateIndex
CREATE INDEX "CourseWord_wordId_idx" ON "CourseWord"("wordId");

-- CreateIndex
CREATE UNIQUE INDEX "CourseWord_courseId_wordId_key" ON "CourseWord"("courseId", "wordId");

-- CreateIndex
CREATE INDEX "ImportJob_userId_createdAt_idx" ON "ImportJob"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Course_ownerId_isCustom_idx" ON "Course"("ownerId", "isCustom");

-- CreateIndex
CREATE INDEX "WordBook_ownerId_idx" ON "WordBook"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "WordBook_ownerId_word_key" ON "WordBook"("ownerId", "word");

-- AddForeignKey
ALTER TABLE "WordBook" ADD CONSTRAINT "WordBook_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserWordBook" ADD CONSTRAINT "UserWordBook_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserWordBookItem" ADD CONSTRAINT "UserWordBookItem_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "UserWordBook"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserWordBookItem" ADD CONSTRAINT "UserWordBookItem_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "WordBook"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseWord" ADD CONSTRAINT "CourseWord_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseWord" ADD CONSTRAINT "CourseWord_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "WordBook"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportJob" ADD CONSTRAINT "ImportJob_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
