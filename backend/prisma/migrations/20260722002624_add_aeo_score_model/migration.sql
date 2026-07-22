-- CreateTable
CREATE TABLE "AeoScore" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'AEO',
    "score" DOUBLE PRECISION NOT NULL,
    "breakdown" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AeoScore_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AeoScore_projectId_category_createdAt_idx" ON "AeoScore"("projectId", "category", "createdAt");

-- AddForeignKey
ALTER TABLE "AeoScore" ADD CONSTRAINT "AeoScore_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
