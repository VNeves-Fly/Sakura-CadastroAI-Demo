-- AlterTable
ALTER TABLE "promotores" DROP COLUMN "base",
ALTER COLUMN "sica" DROP NOT NULL,
ALTER COLUMN "link" DROP NOT NULL;

-- CreateTable
CREATE TABLE "promotor_bases" (
    "id" TEXT NOT NULL,
    "promotorId" TEXT NOT NULL,
    "baseSigla" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "promotor_bases_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "promotor_bases_baseSigla_idx" ON "promotor_bases"("baseSigla");

-- CreateIndex
CREATE UNIQUE INDEX "promotor_bases_promotorId_baseSigla_key" ON "promotor_bases"("promotorId", "baseSigla");

-- CreateIndex
CREATE UNIQUE INDEX "promotores_email_key" ON "promotores"("email");

-- AddForeignKey
ALTER TABLE "promotor_bases" ADD CONSTRAINT "promotor_bases_promotorId_fkey" FOREIGN KEY ("promotorId") REFERENCES "promotores"("id") ON DELETE CASCADE ON UPDATE CASCADE;
