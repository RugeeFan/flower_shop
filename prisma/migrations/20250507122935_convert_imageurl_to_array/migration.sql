/*
  Warnings:

  - The `imageUrl` column on the `PageContent` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "PageContent" DROP COLUMN "imageUrl",
ADD COLUMN     "imageUrl" TEXT[];
