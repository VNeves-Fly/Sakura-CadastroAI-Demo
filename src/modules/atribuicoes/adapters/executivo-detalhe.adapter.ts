import { hashParaNumero } from "@/modules/shared/utils/hash-deterministico.util";
import type { AgenciaResumoPromotor } from "@/modules/cadastro/domain/repositories/agencia-repository";
import type { PromotorProps } from "@/modules/atribuicoes/domain/entities/promotor.entity";
import type { GestorOpcao } from "@/modules/atribuicoes/types/promotor-crud.types";
import {
  IDENTIDADES_AGENCIAS_COMPARTILHADAS,
  MOCK_AGENCIAS_EXECUTIVO,
} from "@/modules/crm-mock/agencias.mock-data";
import type {
  ExecutivoAgenciaResumo,
  ExecutivoPerfil,
} from "@/modules/atribuicoes/types/executivo-detalhe.types";

// Divide `total` em `pesos.length` partes inteiras proporcionais aos
// pesos, garantindo que a soma bate exatamente com `total` (o resto vai
// pro último grupo) — usado pra particionar a carteira em segmentos mock
// sem "sobrar"/"faltar" agência na conta. Tipo genérico `const T` preserva
// o tamanho da tupla de entrada, então desestruturar o resultado é
// type-safe (sem `number | undefined`).
function particionar<const T extends number[]>(
  total: number,
  pesos: T,
): { [K in keyof T]: number } {
  const somaPesos = pesos.reduce((acc, peso) => acc + peso, 0);
  if (total === 0 || somaPesos === 0) {
    return pesos.map(() => 0) as { [K in keyof T]: number };
  }

  const partes = pesos.map((peso) => Math.floor((total * peso) / somaPesos));
  const somaParcial = partes.reduce((acc, parte) => acc + parte, 0);
  partes[partes.length - 1] = (partes[partes.length - 1] ?? 0) + (total - somaParcial);
  return partes as { [K in keyof T]: number };
}

// TODO(mock): janela de "conquistas" ainda é decisão de negócio em aberto
// (ano civil? 12m corridos? desde o início do relacionamento?) — ver
// docs/mock-exec.md §3.2. Continua gerado por hash até essa decisão.
function gerarConquistas(total: number, base: number) {
  const [agencias10m, agencias1m, agencias100k, agencias10k, agenciasSemVenda] = particionar(
    total,
    [
      1 + (base % 3),
      3 + ((base >> 2) % 5),
      6 + ((base >> 4) % 8),
      8 + ((base >> 6) % 10),
      2 + ((base >> 8) % 6),
    ],
  );
  return { agencias10m, agencias1m, agencias100k, agencias10k, agenciasSemVenda };
}

export function mapAgencia(agencia: AgenciaResumoPromotor): ExecutivoAgenciaResumo {
  return {
    id: agencia.id,
    nome: agencia.razaoSocial,
    cnpj: agencia.cnpj,
    status: agencia.status,
    criadoEm: agencia.createdAt,
  };
}

// Demo (/crm/*): monta o portfólio mock de agências do executivo no shape
// "banco local" (AgenciaResumoPromotor) que montarExecutivoPerfil/mapAgencia
// esperam — evita duplicar esse mapeamento nas 3 páginas que precisam dele
// (detalhe/agências/agenda do executivo). `MOCK_AGENCIAS_EXECUTIVO` (shape
// "carteira SST") não carrega `executivoNome` — a identidade de dono vem de
// `IDENTIDADES_AGENCIAS_COMPARTILHADAS` (mesmos ids, mesma ordem, ver
// crm-mock/agencias.mock-data.ts), por isso filtramos ali e casamos por id.
export function listarAgenciasMockDoExecutivo(nomeExecutivo: string): AgenciaResumoPromotor[] {
  const idsDoExecutivo = new Set(
    IDENTIDADES_AGENCIAS_COMPARTILHADAS.filter(
      (identidade) => identidade.executivoNome === nomeExecutivo,
    ).map((identidade) => identidade.id),
  );

  return MOCK_AGENCIAS_EXECUTIVO.filter((agencia) => idsDoExecutivo.has(agencia.id)).map(
    (agencia) => ({
      id: agencia.id,
      razaoSocial: agencia.nome,
      cnpj: agencia.cnpj,
      status: agencia.status,
      createdAt: new Date(),
    }),
  );
}

// Cabeçalho de perfil do executivo (SPEC seções 3) — 100% real, vem de
// Promotor/Agencia do próprio banco (não depende do SST). Separado do
// dashboard (ver executivo-dashboard.controller.ts) porque as páginas
// `agencias/`/`agenda/` só precisam disto pro resto da página (filtros,
// tabela, agenda), sem esperar o dashboard inteiro montar.
export function montarExecutivoPerfil(
  promotor: PromotorProps,
  gestoresPorId: Map<string, GestorOpcao>,
  agenciasRaw: AgenciaResumoPromotor[],
): ExecutivoPerfil {
  const base = hashParaNumero(promotor.id);
  const totalAgencias = agenciasRaw.length;

  // `totalAgencias`/`vendendoUltimos30d` aqui continuam mock/local-DB —
  // usados só como fallback de `ExecutivoProfileHeader` (quando os slots
  // `statsAgenciasSlot`/`statsVendendo30dSlot` não são passados) e como
  // seed do resto do mock service (kpis.projecaoFimMes, conquistas,
  // saudeCarteira quando o SST falha, etc.). O número REAL e exibido nas
  // 3 páginas (dashboard/agencias/agenda) hoje vem de
  // `criarExecutivoHeaderStatsSlots`/`executivoDashboardController.obterCrossCanalEMiniStats`
  // (ver as respectivas page.tsx) — decisão do usuário (2026-08-20) de
  // manter o header consistente entre abas, pagando o custo do SST
  // (roster + loop de terrestre) também em agencias/agenda.
  const vendendoUltimos30d = Math.round(totalAgencias * (0.3 + (base % 50) / 100));
  const vendendoUltimos30dPct =
    totalAgencias > 0 ? Math.round((vendendoUltimos30d / totalAgencias) * 100) : 0;

  return {
    id: promotor.id,
    nome: promotor.nome,
    sica: promotor.sica,
    email: promotor.email,
    bases: promotor.bases,
    gestorNome: promotor.gestorId ? (gestoresPorId.get(promotor.gestorId)?.nome ?? null) : null,
    totalAgencias,
    vendendoUltimos30d,
    vendendoUltimos30dPct,
    conquistas: gerarConquistas(totalAgencias, base),
  };
}
