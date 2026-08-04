
-- AlterTable
ALTER TABLE "promotores" ADD COLUMN     "gestorId" TEXT,
ADD COLUMN     "userId" TEXT;

-- CreateTable
CREATE TABLE "gestores" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT,
    "telefone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT,

    CONSTRAINT "gestores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gestor_bases" (
    "id" TEXT NOT NULL,
    "gestorId" TEXT NOT NULL,
    "baseSigla" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gestor_bases_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "gestores_email_key" ON "gestores"("email");

-- CreateIndex
CREATE UNIQUE INDEX "gestores_userId_key" ON "gestores"("userId");

-- CreateIndex
CREATE INDEX "gestor_bases_baseSigla_idx" ON "gestor_bases"("baseSigla");

-- CreateIndex
CREATE UNIQUE INDEX "gestor_bases_gestorId_baseSigla_key" ON "gestor_bases"("gestorId", "baseSigla");

-- CreateIndex
CREATE UNIQUE INDEX "promotores_userId_key" ON "promotores"("userId");

-- CreateIndex
CREATE INDEX "promotores_gestorId_idx" ON "promotores"("gestorId");

-- AddForeignKey
ALTER TABLE "promotores" ADD CONSTRAINT "promotores_gestorId_fkey" FOREIGN KEY ("gestorId") REFERENCES "gestores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotores" ADD CONSTRAINT "promotores_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gestores" ADD CONSTRAINT "gestores_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gestor_bases" ADD CONSTRAINT "gestor_bases_gestorId_fkey" FOREIGN KEY ("gestorId") REFERENCES "gestores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

