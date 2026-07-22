-- CreateTable
CREATE TABLE "BrandScore" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'BRAND',
    "score" DOUBLE PRECISION NOT NULL,
    "breakdown" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BrandScore_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BrandScore_projectId_category_createdAt_idx" ON "BrandScore"("projectId", "category", "createdAt");

-- AddForeignKey
ALTER TABLE "BrandScore" ADD CONSTRAINT "BrandScore_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
