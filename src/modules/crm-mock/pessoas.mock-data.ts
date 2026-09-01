// Executivos (Promotor) e Gestores fictícios do CRM demo — mesmos nomes
// de `DUPLAS_EXEC_GESTOR_MOCK` em agencias.mock-data.ts, para que
// /crm/executivos e /crm/gestores mostrem a mesma identidade que já
// aparece como executivoNome/gestorNome nas agências mock. São instâncias
// reais das entidades de domínio (Promotor/Gestor) só que com dados
// fictícios, para reaproveitar os adapters/telas existentes sem alterar
// seus tipos.

import { Promotor } from "@/modules/atribuicoes/domain/entities/promotor.entity";
import { Gestor } from "@/modules/gestores/domain/entities/gestor.entity";
import {
  DUPLAS_EXEC_GESTOR_MOCK,
  executivoIdMock,
  gestorIdMock,
} from "@/modules/crm-mock/agencias.mock-data";

function emailMock(nome: string): string {
  const slug = nome.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, ".").toLowerCase();
  return `${slug}@flysakura.com`;
}

const NOMES_GESTORES = Array.from(new Set(DUPLAS_EXEC_GESTOR_MOCK.map(([, gestor]) => gestor)));

const BASES_POR_GESTOR: Record<string, string[]> = {
  "Douglas Mendes": ["GRU", "GIG"],
  "Patrícia Lima": ["CNF", "POA"],
  "Eduardo Martins": ["SSA", "REC", "FOR"],
};

export const MOCK_GESTORES: Gestor[] = NOMES_GESTORES.map((nome, indice) =>
  Gestor.create({
    id: gestorIdMock(nome),
    nome,
    sica: null,
    email: emailMock(nome),
    telefone: null,
    userId: null,
    bases: BASES_POR_GESTOR[nome] ?? ["GRU"],
    createdAt: new Date(2025, indice, 1),
    updatedAt: new Date(2025, indice, 1),
  }),
);

const BASES_POR_EXECUTIVO: Record<string, string[]> = {
  "Marina Costa": ["GRU"],
  "Rafael Andrade": ["GIG"],
  "Juliana Ferreira": ["CNF"],
  "Thiago Souza": ["POA"],
  "Camila Rocha": ["SSA"],
  "Bruno Cardoso": ["REC", "FOR"],
};

export const MOCK_EXECUTIVOS: Promotor[] = DUPLAS_EXEC_GESTOR_MOCK.filter(
  ([executivo]) => executivo !== null,
).map(([executivo, gestor], indice) => {
  const nome = executivo as string;
  const gestorId = gestorIdMock(gestor);
  return Promotor.create({
    id: executivoIdMock(nome),
    sica: 40_001 + indice,
    nome,
    gestorId,
    email: emailMock(nome),
    telefone: null,
    link: null,
    linkExecutivoId: [],
    bases: BASES_POR_EXECUTIVO[nome] ?? ["GRU"],
    userId: null,
  });
});

export function buscarExecutivoMockPorId(id: string): Promotor | null {
  return MOCK_EXECUTIVOS.find((executivo) => executivo.id === id) ?? null;
}

export function buscarGestorMockPorId(id: string): Gestor | null {
  return MOCK_GESTORES.find((gestor) => gestor.id === id) ?? null;
}

export function listarExecutivosMockPorGestor(gestorId: string): Promotor[] {
  return MOCK_EXECUTIVOS.filter((executivo) => executivo.gestorId === gestorId);
}
