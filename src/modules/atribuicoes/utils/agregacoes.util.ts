import type { Promotor } from "@/modules/atribuicoes/domain/entities/promotor.entity";
import type { CidadeComercial } from "@/modules/atribuicoes/domain/entities/cidade-comercial.entity";
import type {
  FiltrosAtribuicoes,
  ResumoBase,
  ResumoExecutivo,
  ResumoGestor,
  ResumoRegiao,
} from "@/modules/atribuicoes/types/atribuicao.types";

const NAO_ATRIBUIDO = "Não atribuído";

function normalizar(valor: string): string {
  return valor
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

export function filtrarCidades(
  cidades: CidadeComercial[],
  filtros: FiltrosAtribuicoes,
): CidadeComercial[] {
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

export function agregarRegioes(cidades: CidadeComercial[]): ResumoRegiao[] {
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

export function agregarBases(cidades: CidadeComercial[]): ResumoBase[] {
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

// Agregação pura do mock de cidades (nomes abreviados/apelidos,
// "MAPA COMERCIAL GESTORES") — usada só pelos filtros, pelo Remanejar e
// pela tela de Substituir, que mexem exatamente nesses valores brutos
// (CidadeComercial.executivo/gestor). A identidade real de cada pessoa (nome
// completo, contato, SICA) vive na tabela Promotor — ver
// paraExecutivosView/paraGestoresView, usadas pelas abas Executivos/
// Gestores e pela ficha do colaborador.
export function agregarExecutivos(cidades: CidadeComercial[]): ResumoExecutivo[] {
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
      idSica: null,
      email: null,
      telefone: null,
    }))
    .sort((a, b) => a.executivo.localeCompare(b.executivo));
}

export function agregarGestores(cidades: CidadeComercial[]): ResumoGestor[] {
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
      idSica: null,
      email: null,
      telefone: null,
    }))
    .sort((a, b) => b.totalExecutivos - a.totalExecutivos);
}

// Estatísticas de cidades/bases atendidas por nome (do mock de
// cidades) — cruzamento por igualdade EXATA de string com o nome real
// do Promotor. A planilha real usa nome completo; o mock de cidades
// usa muito apelido/primeiro nome, então a maioria não bate — isso é
// esperado (mostra 0 cidades/sem base em vez de adivinhar por
// aproximação, que arriscaria juntar pessoas diferentes).
function estatisticasPorNome(cidades: CidadeComercial[], campo: "executivo" | "gestor") {
  const mapa = new Map<string, { bases: Set<string>; totalCidades: number }>();
  for (const cidade of cidades) {
    const nome = cidade[campo];
    if (!nome) continue;
    const entrada = mapa.get(nome) ?? { bases: new Set<string>(), totalCidades: 0 };
    entrada.totalCidades += 1;
    if (cidade.base) entrada.bases.add(cidade.base);
    mapa.set(nome, entrada);
  }
  return mapa;
}

// Fonte real de identidade (planilha "Links Promotores.xlsx", tabela
// Promotor) pra aba Executivos — todo promotor tem SICA, sem apelido.
// Cruza com o mock de cidades só pra estatística de bases/cidades
// atendidas (ver estatisticasPorNome).
export function paraExecutivosView(
  promotores: Promotor[],
  cidades: CidadeComercial[],
): ResumoExecutivo[] {
  const stats = estatisticasPorNome(cidades, "executivo");

  return promotores
    .map((promotor) => {
      const entrada = stats.get(promotor.nome);
      return {
        executivo: promotor.nome,
        base: entrada && entrada.bases.size > 0 ? [...entrada.bases].join(", ") : null,
        totalBases: entrada?.bases.size ?? 0,
        gestor: promotor.gestor,
        totalCidades: entrada?.totalCidades ?? 0,
        totalAgenciasMock: mockTotalAgencias(promotor.nome),
        idSica: promotor.sica,
        email: promotor.email,
        telefone: promotor.telefone,
      };
    })
    .sort((a, b) => a.executivo.localeCompare(b.executivo));
}

// Idem, pra aba Gestores — "gestor" aqui é qualquer nome que apareça na
// coluna Gestor de pelo menos um promotor; o contato (SICA/e-mail/tel)
// só existe se esse gestor também tiver sua própria linha de promotor
// (ex.: gestores que atendem cidades diretamente).
export function paraGestoresView(
  promotores: Promotor[],
  cidades: CidadeComercial[],
): ResumoGestor[] {
  const stats = estatisticasPorNome(cidades, "gestor");
  const promotorPorNome = new Map(promotores.map((promotor) => [promotor.nome, promotor]));
  const nomesGestores = [...new Set(promotores.map((promotor) => promotor.gestor))].sort((a, b) =>
    a.localeCompare(b),
  );

  return nomesGestores.map((nomeGestor) => {
    const entrada = stats.get(nomeGestor);
    const contato = promotorPorNome.get(nomeGestor) ?? null;
    const subordinados = promotores.filter((promotor) => promotor.gestor === nomeGestor);

    return {
      gestor: nomeGestor,
      totalBases: entrada?.bases.size ?? 0,
      totalExecutivos: subordinados.length,
      totalCidades: entrada?.totalCidades ?? 0,
      totalAgenciasMock: subordinados.reduce(
        (total, promotor) => total + mockTotalAgencias(promotor.nome),
        0,
      ),
      idSica: contato?.sica ?? null,
      email: contato?.email ?? null,
      telefone: contato?.telefone ?? null,
    };
  });
}
