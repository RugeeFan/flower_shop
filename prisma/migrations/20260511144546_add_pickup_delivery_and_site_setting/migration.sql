-- CreateEnum
CREATE TYPE "DeliveryType" AS ENUM ('DELIVERY', 'PICKUP');

-- CreateEnum
CREATE TYPE "PickupLocation" AS ENUM ('PARRAMATTA', 'GORDON');

-- CreateEnum
CREATE TYPE "PickupTimeSlot" AS ENUM ('SLOT_8_11', 'SLOT_11_14', 'SLOT_14_18');

-- CreateEnum
CREATE TYPE "DeliveryWindow" AS ENUM ('RESIDENTIAL', 'BUSINESS_SCHOOL', 'PRIORITY');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "deliveryFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "deliveryType" "DeliveryType" NOT NULL DEFAULT 'DELIVERY',
ADD COLUMN     "deliveryWindow" "DeliveryWindow",
ADD COLUMN     "pickupLocation" "PickupLocation",
ADD COLUMN     "pickupTimeSlot" "PickupTimeSlot",
ALTER COLUMN "address" DROP NOT NULL,
ALTER COLUMN "postcode" DROP NOT NULL;

-- CreateTable
CREATE TABLE "SiteSetting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteSetting_pkey" PRIMARY KEY ("key")
);

