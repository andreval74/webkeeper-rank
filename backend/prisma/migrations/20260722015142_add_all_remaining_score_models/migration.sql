-- CreateTable
CREATE TABLE "UxScore" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'UX',
    "score" DOUBLE PRECISION NOT NULL,
    "breakdown" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UxScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReputationScore" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'REPUTATION',
    "score" DOUBLE PRECISION NOT NULL,
    "breakdown" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReputationScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialScore" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'SOCIAL',
    "score" DOUBLE PRECISION NOT NULL,
    "breakdown" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LocalScore" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'LOCAL',
    "score" DOUBLE PRECISION NOT NULL,
    "breakdown" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LocalScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConversionScore" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'CONVERSION',
    "score" DOUBLE PRECISION NOT NULL,
    "breakdown" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConversionScore_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UxScore_projectId_category_createdAt_idx" ON "UxScore"("projectId", "category", "createdAt");

-- CreateIndex
CREATE INDEX "ReputationScore_projectId_category_createdAt_idx" ON "ReputationScore"("projectId", "category", "createdAt");

-- CreateIndex
CREATE INDEX "SocialScore_projectId_category_createdAt_idx" ON "SocialScore"("projectId", "category", "createdAt");

-- CreateIndex
CREATE INDEX "LocalScore_projectId_category_createdAt_idx" ON "LocalScore"("projectId", "category", "createdAt");

-- CreateIndex
CREATE INDEX "ConversionScore_projectId_category_createdAt_idx" ON "ConversionScore"("projectId", "category", "createdAt");

-- AddForeignKey
ALTER TABLE "UxScore" ADD CONSTRAINT "UxScore_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReputationScore" ADD CONSTRAINT "ReputationScore_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialScore" ADD CONSTRAINT "SocialScore_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocalScore" ADD CONSTRAINT "LocalScore_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversionScore" ADD CONSTRAINT "ConversionScore_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
