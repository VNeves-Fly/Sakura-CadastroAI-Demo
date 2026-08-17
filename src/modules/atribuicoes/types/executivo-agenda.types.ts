// Agenda do executivo (SPEC seção 5) — Kanban/Calendário/Lista sobre a
// carteira real de agências. NÃO existe model de visita no Prisma hoje
// (`VisitaAgenda` sugerido na SPEC seção 9 não foi criado — decisão do
// projeto de não fazer migration sem aprovação explícita); o status de
// visita/agendamento vive só no navegador (store Zustand persistido em
// localStorage, ver use-agenda-visitas.store.ts), não no backend. Some
// se o usuário limpar o localStorage ou abrir em outro navegador — é uma
// simulação de front-end, não uma feature persistida de verdade.
export type AgendaStatus = "sem_visita" | "agendada" | "visitada";

export interface AgendaAgenciaView {
  id: string;
  nome: string;
  cnpj: string;
  status: AgendaStatus;
  dataAgendada: string | null; // ISO yyyy-MM-dd
  horaAgendada: string | null; // HH:mm
  observacao: string | null;
  concluidaEm: string | null; // ISO yyyy-MM-dd
  // Financeiro mock (aba Lista) — mesma ressalva de "sem fonte real hoje"
  // do dashboard (ver executivo-detalhe.types.ts).
  aereoNacional: number;
  aereoInternacional: number;
  terrestre: number;
}
