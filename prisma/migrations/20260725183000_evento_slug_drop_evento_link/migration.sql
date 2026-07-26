-- DropForeignKey
ALTER TABLE "evento_links" DROP CONSTRAINT "evento_links_associacaoId_fkey";

-- DropForeignKey
ALTER TABLE "evento_links" DROP CONSTRAINT "evento_links_eventoId_fkey";

-- DropForeignKey
ALTER TABLE "evento_links" DROP CONSTRAINT "evento_links_promotorId_fkey";

-- AlterTable
ALTER TABLE "eventos" ADD COLUMN     "slug" TEXT;

-- DropTable
DROP TABLE "evento_links";

-- CreateIndex
CREATE UNIQUE INDEX "eventos_slug_key" ON "eventos"("slug");
