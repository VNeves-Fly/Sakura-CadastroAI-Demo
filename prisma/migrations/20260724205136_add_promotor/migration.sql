-- CreateTable
CREATE TABLE "promotores" (
    "id" TEXT NOT NULL,
    "sica" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "gestor" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "link" TEXT NOT NULL,
    "base" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "promotores_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "promotores_sica_key" ON "promotores"("sica");
