import { hashParaNumero } from "@/modules/shared/utils/hash-deterministico.util";
import type { ExecutivoAgenciaResumo } from "@/modules/atribuicoes/types/executivo-detalhe.types";
import type { AgendaAgenciaView } from "@/modules/atribuicoes/types/executivo-agenda.types";

function paraIso(data: Date): string {
  return data.toISOString().slice(0, 10);
}

// Seed inicial da agenda (SPEC seção 5.1: a maioria nasce "sem visita",
// poucas já "agendadas", nenhuma "visitada" — mesma proporção do exemplo
// da spec, 416/5/0). Determinístico por id, client-side (não precisa ser
// SSR-safe porque a Agenda inteira já é client-only, ver
// executivo-agenda-view.tsx). O status real de cada agência depois disso
// é sobrescrito pelos overrides do usuário (ver agenda-visitas.store.ts).
export function montarAgendaSeed(agencias: ExecutivoAgenciaResumo[]): AgendaAgenciaView[] {
  const hoje = new Date();

  return agencias.map((agencia) => {
    const seed = hashParaNumero(agencia.id);
    const aereoNacional = 1_000 + (seed % 50_000);
    const aereoInternacional = Math.round(aereoNacional * (0.1 + ((seed >> 3) % 30) / 100));
    const terrestre = Math.round(aereoNacional * (0.01 + ((seed >> 5) % 4) / 100));

    const nasceAgendada = seed % 25 === 0;
    let dataAgendada: string | null = null;
    let horaAgendada: string | null = null;

    if (nasceAgendada) {
      const dataFutura = new Date(hoje);
      dataFutura.setDate(dataFutura.getDate() + 1 + (seed % 10));
      dataAgendada = paraIso(dataFutura);
      const hora = 8 + (seed % 10);
      const minuto = seed % 60;
      horaAgendada = `${String(hora).padStart(2, "0")}:${String(minuto).padStart(2, "0")}`;
    }

    return {
      id: agencia.id,
      nome: agencia.nome,
      cnpj: agencia.cnpj,
      status: nasceAgendada ? "agendada" : "sem_visita",
      dataAgendada,
      horaAgendada,
      observacao: null,
      concluidaEm: null,
      aereoNacional,
      aereoInternacional,
      terrestre,
    };
  });
}
