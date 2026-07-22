-- Drop the old WriScore table and recreate as CategoryScore with category field

-- DropForeignKey
ALTER TABLE "WriScore" DROP CONSTRAINT "WriScore_projectId_fkey";

-- DropTable
DROP TABLE "WriScore";

-- CreateTable
CREATE TABLE "CategoryScore" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "breakdown" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CategoryScore_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CategoryScore_projectId_category_createdAt_idx" ON "CategoryScore"("projectId", "category", "createdAt");

-- AddForeignKey
ALTER TABLE "CategoryScore" ADD CONSTRAINT "CategoryScore_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
