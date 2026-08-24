import { hashParaNumero } from "@/modules/shared/utils/hash-deterministico.util";
import { nivelSeed } from "@/modules/gestores/types/gestor-nivel.types";
import type { AgenciaResumoPromotor } from "@/modules/cadastro/domain/repositories/agencia-repository";
import type { RankingAgencia } from "@/modules/gestores/types/gestor-detalhe.types";

export interface GestorRaw {
  id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  bases: string[];
}

// Um executivo (Promotor) subordinado a este gestor, com as agências reais
// da sua carteira — usado tanto pra contar totais reais (executivos/
// agências) quanto pra ranquear "top executivos" e montar "ações
// prioritárias" com a base real de cada agência (derivada do executivo
// dono, já que Agencia não expõe a própria base diretamente). email/sica
// alimentam a aba Executivos do gestor (ver gestor-executivos-tab.adapter.ts).
export interface ExecutivoComCarteira {
  id: string;
  nome: string;
  email: string;
  sica: number | null;
  bases: string[];
  agencias: AgenciaResumoPromotor[];
}

// "SAKURA Comercial" -> "GEST-SAKURA" — sem fonte real de identificador
// único hoje (model Gestor não tem esse campo), gerado a partir da
// primeira palavra do nome.
function gerarIdentificador(nome: string): string {
  const primeiraPalavra =
    nome
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .split(/\s+/)
      .filter(Boolean)[0] ?? "GESTOR";
  return `GEST-${primeiraPalavra.toUpperCase().slice(0, 12)}`;
}

// "Atualizado em DD/MM às HH:mm" (SPEC 3.5) — mesma lógica de
// gerarAtualizadoEm em executivo-detalhe.adapter.ts.
function gerarAtualizadoEm(base: number): string {
  const minutosAtras = 5 + (base % 180);
  const data = new Date(Date.now() - minutosAtras * 60_000);
  const doisDigitos = (n: number) => String(n).padStart(2, "0");
  return `${doisDigitos(data.getDate())}/${doisDigitos(data.getMonth() + 1)} às ${doisDigitos(data.getHours())}:${doisDigitos(data.getMinutes())}`;
}

// Rankings "Top 10 Agências" (SPEC 3.9) — sempre "hoje", por modalidade.
// Mesma lógica de gerarRankingHoje em executivo-detalhe.adapter.ts, mas
// sobre a carteira consolidada de todos os executivos deste gestor.
// Permanece mock (SPEC 3.8 / paridade com o Executivo, ver
// docs/plano-gestores-backend.md §4.5).
function gerarRankingHoje(
  agencias: AgenciaResumoPromotor[],
  seedBase: number,
  valorMaximo: number,
  ticketMedio: number,
): RankingAgencia[] {
  return agencias
    .map((agencia, indice) => {
      const seed = hashParaNumero(agencia.id + seedBase + indice);
      const valor = 500 + (seed % valorMaximo);
      return {
        nome: agencia.razaoSocial,
        valor,
        quantidade: Math.max(1, Math.round(valor / ticketMedio)),
      };
    })
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 10)
    .map((item, indice) => ({ posicao: indice + 1, ...item }));
}

// Cartão de identificação + KPIs de topo — compartilhado entre as 3 abas do
// detalhe do gestor (Dashboard/Executivos/Agências). Extraído do dashboard
// pra cada aba poder buscar só isso, sem gerar o dashboard inteiro à toa.
export function montarGestorPerfil(gestor: GestorRaw, executivos: ExecutivoComCarteira[]) {
  const base = hashParaNumero(gestor.id);
  const totalAgencias = executivos.reduce(
    (total, executivo) => total + executivo.agencias.length,
    0,
  );
  const totalExecutivos = executivos.length;
  const ativo = base % 10 !== 0; // mock — ~90% ativo (sem status real no model)
  const vendendoUltimos30d = Math.round(totalAgencias * (0.3 + (base % 50) / 100));
  const vendendoUltimos30dPct =
    totalAgencias > 0 ? Math.round((vendendoUltimos30d / totalAgencias) * 100) : 0;

  return {
    id: gestor.id,
    nome: gestor.nome,
    identificador: gerarIdentificador(gestor.nome),
    email: gestor.email,
    telefone: gestor.telefone,
    ativo,
    // Nível não é resolvido aqui — o override mora em localStorage
    // (gestor-niveis.store.ts), inacessível no servidor, e o campo ainda
    // não é exibido nesta página; seed determinístico como fallback neutro
    // até isso mudar.
    nivel: nivelSeed(gestor.id),
    bases: gestor.bases,
    basePrincipal: gestor.bases[0] ?? null,
    totalExecutivos,
    totalAgencias,
    vendendoUltimos30d,
    vendendoUltimos30dPct,
  };
}

// Parte do dashboard do Gestor que permanece mock de apresentação — os 3
// rankings "Top 10 Agências (Hoje)" (SST não expõe venda "de hoje" por
// agência) e o timestamp de "Atualizado em" (sem campo de sincronização
// exposto). Margem/rentabilidade por canal (Aéreo/Terrestre) deixaram de
// ser mock aqui em 2026-08-24 — ver somarMargemRentab em
// agregacoes-gestor.util.ts (agregação real da carteira dos executivos
// subordinados, mesma fonte real de hero/kpis/saudeCarteira).
export function montarGestorApresentacaoMock(
  gestorId: string,
  agenciasCarteira: AgenciaResumoPromotor[],
) {
  const base = hashParaNumero(gestorId);

  return {
    atualizadoEm: gerarAtualizadoEm(base),
    topAgenciasHoje: gerarRankingHoje(agenciasCarteira, base + 801, 350_000, 1_200),
    topAgenciasHojeAereo: gerarRankingHoje(agenciasCarteira, base + 902, 340_000, 2_400),
    topAgenciasHojeTerrestre: gerarRankingHoje(agenciasCarteira, base + 1_003, 13_000, 500),
  };
}
