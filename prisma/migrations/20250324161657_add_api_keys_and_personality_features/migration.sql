-- CreateEnum
CREATE TYPE "Role" AS ENUM ('user', 'system');

-- CreateTable
CREATE TABLE "Companion" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "src" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "instructions" TEXT NOT NULL,
    "seed" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "categoryId" TEXT NOT NULL,

    CONSTRAINT "Companion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "companionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiKey" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsed" TIMESTAMP(3),

    CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonalityTrait" (
    "id" TEXT NOT NULL,
    "companionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PersonalityTrait_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingFeedback" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "feedback" TEXT NOT NULL,
    "accuracy" DOUBLE PRECISION NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrainingFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Companion_categoryId_idx" ON "Companion"("categoryId");

-- CreateIndex
CREATE INDEX "Companion_userId_idx" ON "Companion"("userId");

-- CreateIndex
CREATE INDEX "Message_companionId_idx" ON "Message"("companionId");

-- CreateIndex
CREATE INDEX "Message_userId_idx" ON "Message"("userId");

-- CreateIndex
CREATE INDEX "Message_createdAt_idx" ON "Message"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ApiKey_key_key" ON "ApiKey"("key");

-- CreateIndex
CREATE INDEX "PersonalityTrait_companionId_idx" ON "PersonalityTrait"("companionId");

-- CreateIndex
CREATE INDEX "PersonalityTrait_userId_idx" ON "PersonalityTrait"("userId");

-- CreateIndex
CREATE INDEX "PersonalityTrait_type_idx" ON "PersonalityTrait"("type");

-- CreateIndex
CREATE INDEX "TrainingFeedback_messageId_idx" ON "TrainingFeedback"("messageId");

-- CreateIndex
CREATE INDEX "TrainingFeedback_userId_idx" ON "TrainingFeedback"("userId");

-- AddForeignKey
ALTER TABLE "Companion" ADD CONSTRAINT "Companion_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_companionId_fkey" FOREIGN KEY ("companionId") REFERENCES "Companion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
