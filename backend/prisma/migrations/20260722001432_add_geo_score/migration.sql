-- CreateTable
CREATE TABLE "GeoScore" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'GEO',
    "score" DOUBLE PRECISION NOT NULL,
    "breakdown" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GeoScore_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GeoScore_projectId_category_createdAt_idx" ON "GeoScore"("projectId", "category", "createdAt");

-- AddForeignKey
ALTER TABLE "GeoScore" ADD CONSTRAINT "GeoScore_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
