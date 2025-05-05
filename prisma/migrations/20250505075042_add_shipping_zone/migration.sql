/*
  Warnings:

  - You are about to drop the column `price` on the `ShippingZone` table. All the data in the column will be lost.
  - Added the required column `km` to the `ShippingZone` table without a default value. This is not possible if the table is not empty.
  - Added the required column `large` to the `ShippingZone` table without a default value. This is not possible if the table is not empty.
  - Added the required column `medium` to the `ShippingZone` table without a default value. This is not possible if the table is not empty.
  - Added the required column `small` to the `ShippingZone` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "ShippingZone_postcode_key";

-- AlterTable
ALTER TABLE "ShippingZone" DROP COLUMN "price",
ADD COLUMN     "km" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "large" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "medium" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "small" DOUBLE PRECISION NOT NULL;

-- CreateIndex
CREATE INDEX "ShippingZone_postcode_suburb_idx" ON "ShippingZone"("postcode", "suburb");
