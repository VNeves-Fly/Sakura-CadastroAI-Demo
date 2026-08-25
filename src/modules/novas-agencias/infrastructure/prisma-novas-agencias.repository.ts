import { prisma } from "@/modules/shared/infrastructure/prisma/client";

// Fonte real (Prisma local) de identidade/entrada das agências novas —
// sempre roda, com ou sem SST_API_KEY configurada (só as métricas de
// venda dependem do SST, ver novas-agencias.loader.ts). Sem camada
// domain/use-case: mesmo critério simplificado de agencias-crm, tela
// "CRM analytics read-only" não precisa da arquitetura em camadas do
// módulo `cadastro`.

const JANELA_DIAS = 90;

export interface AgenciaAprovadaLocal {
  id: string;
  razaoSocial: string;
  cnpj: string;
  executivoNome: string | null;
  gestorNome: string | null;
  entradaEm: Date;
  // Código SICA (= codigo_empresa do SST), resolvido pela consulta SICA
  // mais recente com sucesso — null se a agência nunca teve uma consulta
  // bem-sucedida (cai no mock por linha no adapter, ver loader.ts).
  codigoEmpresa: number | null;
}

// `Agencia.createdAt` é o início do cadastro, não a aprovação — a data
// real de "entrada" é a transição mais recente pra `status = ativo` em
// `HistoricoEtapaCadastro`. Sem filtrar por `statusAnterior` de propósito:
// qualquer transição PRA ativo conta, independente de onde ela veio.
async function buscarEntradaPorAgenciaId(desde: Date): Promise<Map<string, Date>> {
  const transicoes = await prisma.historicoEtapaCadastro.findMany({
    where: { statusNovo: "ativo", createdAt: { gte: desde } },
    orderBy: { createdAt: "desc" },
    select: { agenciaId: true, createdAt: true },
  });

  const entradaPorAgenciaId = new Map<string, Date>();
  for (const transicao of transicoes) {
    // orderBy desc: a primeira ocorrência de cada agenciaId já é a mais
    // recente — evita duplicar uma agência reaprovada/reativada na janela.
    if (!entradaPorAgenciaId.has(transicao.agenciaId)) {
      entradaPorAgenciaId.set(transicao.agenciaId, transicao.createdAt);
    }
  }
  return entradaPorAgenciaId;
}

export const prismaNovasAgenciasRepository = {
  // Agências com status ATUAL "ativo" (não só a transição no histórico —
  // evita mostrar uma agência ativada e depois recusada/desativada de
  // novo) cuja aprovação caiu dentro da janela de 90 dias.
  async listarAprovadasNaJanela(): Promise<AgenciaAprovadaLocal[]> {
    const desde = new Date();
    desde.setDate(desde.getDate() - JANELA_DIAS);

    const entradaPorAgenciaId = await buscarEntradaPorAgenciaId(desde);
    if (entradaPorAgenciaId.size === 0) return [];

    const agencias = await prisma.agencia.findMany({
      where: { id: { in: [...entradaPorAgenciaId.keys()] }, status: "ativo" },
      select: {
        id: true,
        razaoSocial: true,
        cnpj: true,
        executivo: { select: { nome: true, gestor: { select: { nome: true } } } },
        consultasSst: {
          where: { sucesso: true, encontrado: true },
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { codigoEmpresa: true },
        },
      },
    });

    return agencias.map((agencia) => ({
      id: agencia.id,
      razaoSocial: agencia.razaoSocial,
      cnpj: agencia.cnpj,
      executivoNome: agencia.executivo?.nome ?? null,
      gestorNome: agencia.executivo?.gestor?.nome ?? null,
      // presente por construção: só agências cujo id veio de entradaPorAgenciaId
      entradaEm: entradaPorAgenciaId.get(agencia.id)!,
      codigoEmpresa: agencia.consultasSst[0]?.codigoEmpresa ?? null,
    }));
  },

  // Total histórico de agências ativas (não só as da janela de 90 dias) —
  // alimenta `funil.baseAprovadas`, mesmo critério de "nunca inventar
  // número pra preencher espaço visual" já aplicado ao resto do módulo.
  async contarAtivasNoSistema(): Promise<number> {
    return prisma.agencia.count({ where: { status: "ativo" } });
  },
};
