-- CreateTable
CREATE TABLE "ShippingZone" (
    "id" SERIAL NOT NULL,
    "suburb" TEXT NOT NULL,
    "postcode" TEXT NOT NULL,
    "price" INTEGER NOT NULL,

    CONSTRAINT "ShippingZone_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ShippingZone_postcode_key" ON "ShippingZone"("postcode");
