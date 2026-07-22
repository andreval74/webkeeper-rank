-- CreateTable
CREATE TABLE "AuthorityScore" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'AUTHORITY',
    "score" DOUBLE PRECISION NOT NULL,
    "breakdown" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuthorityScore_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuthorityScore_projectId_category_createdAt_idx" ON "AuthorityScore"("projectId", "category", "createdAt");

-- AddForeignKey
ALTER TABLE "AuthorityScore" ADD CONSTRAINT "AuthorityScore_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
