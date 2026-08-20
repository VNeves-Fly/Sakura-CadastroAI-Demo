import { hashParaNumero } from "@/modules/shared/utils/hash-deterministico.util";
import type { AgenciaResumoPromotor } from "@/modules/cadastro/domain/repositories/agencia-repository";
import type { PromotorProps } from "@/modules/atribuicoes/domain/entities/promotor.entity";
import type { GestorOpcao } from "@/modules/atribuicoes/types/promotor-crud.types";
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

// Cabeçalho de perfil do executivo (SPEC seções 3) — 100% real, vem de
// Promotor/Agencia do próprio banco (não depende do SST). Separado do
// dashboard (ver executivo-dashboard.controller.ts) porque as páginas
// `agencias/` e `agenda/` só precisam disto, sem pagar o custo de montar
// (mock ou real) o dashboard inteiro.
export function montarExecutivoPerfil(
  promotor: PromotorProps,
  gestoresPorId: Map<string, GestorOpcao>,
  agenciasRaw: AgenciaResumoPromotor[],
): ExecutivoPerfil {
  const base = hashParaNumero(promotor.id);
  const totalAgencias = agenciasRaw.length;

  // TODO(mock): mantido síncrono/mock de propósito — calcular o valor real
  // exigiria a mesma chamada ao SST usada em dashboard.miniStats.vendendo30d
  // (ver executivo-dashboard.sst-service.ts), o que pagaria o custo do SST
  // também nas páginas agencias/agenda (que só usam perfil, ver
  // executivo-dashboard.controller.ts). Por isso este número pode divergir
  // do miniStats.vendendo30d real na página do dashboard — o `MockBadge` no
  // header já sinaliza isso ao usuário (ver executivo-profile-header.tsx).
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
