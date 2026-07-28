import type { PrismaClient } from "@prisma/client";
import cidadesRaw from "./data/cidades-mapa-comercial.json";

interface CidadeSeed {
  regiao: string | null;
  estado: string | null;
  cidade: string;
  ddd: string | null;
  base: string | null;
  executivo: string | null;
  gestor: string | null;
  subregiaoSp: string | null;
}

const CIDADES = cidadesRaw as CidadeSeed[];
const TAMANHO_LOTE = 1000;

// Fonte real: planilha "MAPA COMERCIAL GESTORES" (aba MAPA_COMERCIAL_FINAL),
// migrada do mock em memória do módulo atribuições (decisão do usuário,
// 2026-07-27). A tabela vira editável pela tela Remanejar → Substituir
// logo após esse seed — por isso só popula se ainda estiver vazia, pra
// nunca sobrescrever reatribuições já feitas em cima dela.
export async function seedCidadesComerciais(prisma: PrismaClient): Promise<void> {
  const existentes = await prisma.cidadeComercial.count();
  if (existentes > 0) {
    console.warn(`Seed: cidades_comerciais já populada (${existentes} linhas) — pulando`);
    return;
  }

  for (let inicio = 0; inicio < CIDADES.length; inicio += TAMANHO_LOTE) {
    const lote = CIDADES.slice(inicio, inicio + TAMANHO_LOTE);
    await prisma.cidadeComercial.createMany({ data: lote });
  }

  console.warn(`Seed: ${CIDADES.length} cidades comerciais (mapa comercial de gestores)`);
}
