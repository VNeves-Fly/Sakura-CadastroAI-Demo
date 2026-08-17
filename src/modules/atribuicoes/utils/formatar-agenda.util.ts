import { format, parse } from "date-fns";
import { ptBR } from "date-fns/locale";

// "08 de jun., 14:42" (SPEC seção 5.1) — combina a data (ISO) com a hora
// (HH:mm) guardadas separadamente no override de visita.
export function formatarDataHoraAgendada(dataIso: string, hora: string | null): string {
  const data = parse(dataIso, "yyyy-MM-dd", new Date());
  const [horas, minutos] = (hora ?? "00:00").split(":").map(Number);
  data.setHours(horas ?? 0, minutos ?? 0);
  return format(data, "dd 'de' MMM., HH:mm", { locale: ptBR });
}

export function formatarDataCurta(dataIso: string): string {
  const data = parse(dataIso, "yyyy-MM-dd", new Date());
  return format(data, "dd/MM/yyyy", { locale: ptBR });
}
