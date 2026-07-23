import { obterCidades } from "@/modules/atribuicoes/services/atribuicoes-store";
import type {
  Cidade,
  FiltrosAtribuicoes,
  ResumoBase,
  ResumoExecutivo,
  ResumoGestor,
  ResumoRegiao,
} from "@/modules/atribuicoes/types/atribuicao.types";

const NAO_ATRIBUIDO = "Não atribuído";

// Delega pro store em memória (ver atribuicoes-store.ts) — mantido aqui
// só pra não quebrar quem já importava `carregarCidades` daqui.
export function carregarCidades(): Cidade[] {
  return obterCidades();
}

function normalizar(valor: string): string {
  return valor
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

export function filtrarCidades(cidades: Cidade[], filtros: FiltrosAtribuicoes): Cidade[] {
  const busca = filtros.busca?.trim() ? normalizar(filtros.busca.trim()) : null;

  return cidades.filter((cidade) => {
    if (filtros.executivo && cidade.executivo !== filtros.executivo) return false;
    if (filtros.gestor && cidade.gestor !== filtros.gestor) return false;
    if (filtros.base && cidade.base !== filtros.base) return false;
    if (filtros.regiao && cidade.regiao !== filtros.regiao) return false;
    if (busca) {
      const alvo = normalizar(
        [cidade.cidade, cidade.estado, cidade.ddd, cidade.base, cidade.executivo, cidade.gestor]
          .filter(Boolean)
          .join(" "),
      );
      if (!alvo.includes(busca)) return false;
    }
    return true;
  });
}

// Número ilustrativo de agências por executivo — ainda não existe vínculo
// real Agencia -> Executivo no banco. Determinístico (hash simples do
// nome) só pra não mudar a cada reload da página.
export function mockTotalAgencias(nomeExecutivo: string): number {
  let hash = 0;
  for (let i = 0; i < nomeExecutivo.length; i++) {
    hash = (hash * 31 + nomeExecutivo.charCodeAt(i)) % 1000;
  }
  return 3 + (hash % 18);
}

export function agregarRegioes(cidades: Cidade[]): ResumoRegiao[] {
  const mapa = new Map<
    string,
    { totalCidades: number; bases: Set<string>; executivos: Set<string> }
  >();

  for (const cidade of cidades) {
    const chave = cidade.regiao ?? NAO_ATRIBUIDO;
    const entrada = mapa.get(chave) ?? {
      totalCidades: 0,
      bases: new Set<string>(),
      executivos: new Set<string>(),
    };
    entrada.totalCidades += 1;
    if (cidade.base) entrada.bases.add(cidade.base);
    if (cidade.executivo) entrada.executivos.add(cidade.executivo);
    mapa.set(chave, entrada);
  }

  return [...mapa.entries()]
    .map(([regiao, valor]) => ({
      regiao,
      totalCidades: valor.totalCidades,
      totalBases: valor.bases.size,
      totalExecutivos: valor.executivos.size,
    }))
    .sort((a, b) => b.totalCidades - a.totalCidades);
}

export function agregarBases(cidades: Cidade[]): ResumoBase[] {
  const mapa = new Map<
    string,
    { gestores: Set<string>; executivos: Set<string>; totalCidades: number; regioes: Set<string> }
  >();

  for (const cidade of cidades) {
    if (!cidade.base) continue;
    const entrada = mapa.get(cidade.base) ?? {
      gestores: new Set<string>(),
      executivos: new Set<string>(),
      totalCidades: 0,
      regioes: new Set<string>(),
    };
    entrada.totalCidades += 1;
    if (cidade.gestor) entrada.gestores.add(cidade.gestor);
    if (cidade.executivo) entrada.executivos.add(cidade.executivo);
    if (cidade.regiao) entrada.regioes.add(cidade.regiao);
    mapa.set(cidade.base, entrada);
  }

  return [...mapa.entries()]
    .map(([base, valor]) => ({
      base,
      gestor: valor.gestores.size > 0 ? [...valor.gestores].join(", ") : null,
      totalExecutivos: valor.executivos.size,
      totalCidades: valor.totalCidades,
      regioes: [...valor.regioes],
    }))
    .sort((a, b) => a.base.localeCompare(b.base));
}

export function agregarExecutivos(cidades: Cidade[]): ResumoExecutivo[] {
  const mapa = new Map<
    string,
    { bases: Set<string>; gestores: Set<string>; totalCidades: number }
  >();

  for (const cidade of cidades) {
    if (!cidade.executivo) continue;
    const entrada = mapa.get(cidade.executivo) ?? {
      bases: new Set<string>(),
      gestores: new Set<string>(),
      totalCidades: 0,
    };
    entrada.totalCidades += 1;
    if (cidade.base) entrada.bases.add(cidade.base);
    if (cidade.gestor) entrada.gestores.add(cidade.gestor);
    mapa.set(cidade.executivo, entrada);
  }

  return [...mapa.entries()]
    .map(([executivo, valor]) => ({
      executivo,
      base: valor.bases.size > 0 ? [...valor.bases].join(", ") : null,
      totalBases: valor.bases.size,
      gestor: valor.gestores.size > 0 ? [...valor.gestores].join(", ") : null,
      totalCidades: valor.totalCidades,
      totalAgenciasMock: mockTotalAgencias(executivo),
    }))
    .sort((a, b) => a.executivo.localeCompare(b.executivo));
}

export function agregarGestores(cidades: Cidade[]): ResumoGestor[] {
  const mapa = new Map<
    string,
    { bases: Set<string>; executivos: Set<string>; totalCidades: number }
  >();

  for (const cidade of cidades) {
    if (!cidade.gestor) continue;
    const entrada = mapa.get(cidade.gestor) ?? {
      bases: new Set<string>(),
      executivos: new Set<string>(),
      totalCidades: 0,
    };
    entrada.totalCidades += 1;
    if (cidade.base) entrada.bases.add(cidade.base);
    if (cidade.executivo) entrada.executivos.add(cidade.executivo);
    mapa.set(cidade.gestor, entrada);
  }

  return [...mapa.entries()]
    .map(([gestor, valor]) => ({
      gestor,
      totalBases: valor.bases.size,
      totalExecutivos: valor.executivos.size,
      totalCidades: valor.totalCidades,
      // Soma do mock de cada executivo — mantém coerência entre a aba
      // Executivos e a aba Gestores (agências do gestor = soma dos dele).
      totalAgenciasMock: [...valor.executivos].reduce(
        (total, nomeExecutivo) => total + mockTotalAgencias(nomeExecutivo),
        0,
      ),
    }))
    .sort((a, b) => b.totalExecutivos - a.totalExecutivos);
}
