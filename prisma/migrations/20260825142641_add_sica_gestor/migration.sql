-- AlterTable
ALTER TABLE "gestores" ADD COLUMN "sica" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "gestores_sica_key" ON "gestores"("sica");
