import {
  STATUS_AGUARDANDO_ASSINATURA,
  STATUS_AGUARDANDO_ATIVACAO,
  STATUS_AGUARDANDO_CADASTRAMENTO,
  STATUS_AGUARDANDO_VALIDACAO,
  STATUS_EM_ANALISE,
  STATUS_EM_COMPLEMENTAR,
  type SlaEtapaItem,
} from "@/modules/cadastro/domain/repositories/agencia-repository";
import { labelStatusAgencia } from "@/modules/cadastro/utils/status-agencia-label.util";

// Mesma ordem do pipeline (ver comentário no topo de agencia-repository.ts)
// — `ativo`/`recusado` ficam de fora, são etapas finais sem "tempo até
// avançar" (ver ETAPAS_COM_SLA em prisma-agencia.repository.ts).
const ETAPAS_SLA_ORDEM = [
  STATUS_EM_ANALISE,
  STATUS_EM_COMPLEMENTAR,
  STATUS_AGUARDANDO_ASSINATURA,
  STATUS_AGUARDANDO_VALIDACAO,
  STATUS_AGUARDANDO_CADASTRAMENTO,
  STATUS_AGUARDANDO_ATIVACAO,
];

interface SlaPorEtapaCardProps {
  itens: SlaEtapaItem[];
}

// Tempo médio (dias) que os cadastros levam pra sair de cada etapa —
// calculado a partir de HistoricoEtapaCadastro (ver calcularSlaPorEtapa),
// só com trajetos concluídos (etapa em andamento não conta ainda).
export function SlaPorEtapaCard({ itens }: SlaPorEtapaCardProps) {
  const porStatus = new Map(itens.map((item) => [item.status, item]));

  return (
    <div className="border-border bg-card rounded-2xl border p-5">
      <h2 className="text-muted-foreground text-xs font-bold tracking-wide uppercase">
        SLA por etapa
      </h2>
      <p className="text-muted-foreground mt-1 text-xs">
        Tempo médio até o cadastro avançar pra próxima etapa — só considera trajetos já concluídos.
      </p>
      <ul className="mt-4 flex flex-col gap-3">
        {ETAPAS_SLA_ORDEM.map((status) => {
          const item = porStatus.get(status);
          const temDados = item && item.amostras > 0 && item.mediaDias !== null;

          return (
            <li key={status} className="flex items-center justify-between gap-3 text-sm">
              <span className="text-foreground font-medium">{labelStatusAgencia(status)}</span>
              {temDados ? (
                <span className="text-right">
                  <span className="text-foreground font-bold">
                    {item.mediaDias!.toFixed(1)} dias
                  </span>
                  <span className="text-muted-foreground ml-1 text-xs">
                    ({item.amostras} cadastro{item.amostras > 1 ? "s" : ""})
                  </span>
                </span>
              ) : (
                <span className="text-muted-foreground text-xs">sem dados ainda</span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
