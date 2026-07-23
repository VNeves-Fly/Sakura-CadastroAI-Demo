import type { Evento, Executivo } from "@/modules/eventos/types/evento.types";
import { gerarSlugEventoLink } from "@/modules/eventos/utils/slug.util";

// Executivos "afiliados" — no back-end real seriam Users com cargo
// EXECUTIVO (ver enum Cargo em prisma/schema.prisma); aqui é só uma lista
// fixa pro select de "dono do link" funcionar sem tocar banco.
export function gerarExecutivosMock(): Executivo[] {
  return [
    { id: "exec-1", nome: "João Silva", email: "joao.silva@flysakura.com" },
    { id: "exec-2", nome: "Maria Santos", email: "maria.santos@flysakura.com" },
    { id: "exec-3", nome: "Pedro Rocha", email: "pedro.rocha@flysakura.com" },
    { id: "exec-4", nome: "Ana Beatriz", email: "ana.beatriz@flysakura.com" },
  ];
}

function horasAtras(horas: number): string {
  return new Date(Date.now() - horas * 60 * 60 * 1000).toISOString();
}

export function gerarEventosMock(): Evento[] {
  return [
    {
      id: "evento-1",
      nome: "SUMMIT 2026 SP",
      ativo: true,
      createdAt: horasAtras(72),
      links: [
        {
          id: "link-1",
          eventoId: "evento-1",
          executivoId: "exec-1",
          executivoNome: "João Silva",
          slug: gerarSlugEventoLink("SUMMIT 2026 SP", "João Silva"),
          ativo: true,
          totalAgenciasCadastradas: 4,
          createdAt: horasAtras(72),
        },
        {
          id: "link-2",
          eventoId: "evento-1",
          executivoId: "exec-2",
          executivoNome: "Maria Santos",
          slug: gerarSlugEventoLink("SUMMIT 2026 SP", "Maria Santos"),
          ativo: true,
          totalAgenciasCadastradas: 2,
          createdAt: horasAtras(70),
        },
      ],
    },
    {
      id: "evento-2",
      nome: "WTM 2026",
      ativo: true,
      createdAt: horasAtras(20),
      links: [
        {
          id: "link-3",
          eventoId: "evento-2",
          executivoId: "exec-3",
          executivoNome: "Pedro Rocha",
          slug: gerarSlugEventoLink("WTM 2026", "Pedro Rocha"),
          ativo: true,
          totalAgenciasCadastradas: 0,
          createdAt: horasAtras(20),
        },
      ],
    },
  ];
}
