-- AlterTable
ALTER TABLE "blogs" ADD COLUMN     "contentJson" JSONB,
ADD COLUMN     "extractedImageCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "featuredImage" TEXT,
ADD COLUMN     "sourceFilename" TEXT;
