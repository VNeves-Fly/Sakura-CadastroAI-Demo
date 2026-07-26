import { CadastroWizardView } from "@/modules/cadastro/views/wizard/cadastro-wizard-view";
import { atribuicoesAdminController } from "@/modules/atribuicoes/presentation/controllers/atribuicoes-admin.controller";
import { eventosAdminController } from "@/modules/eventos/presentation/controllers/eventos-admin.controller";
import type {
  ExecutivoOption,
  AssociacaoOption,
} from "@/modules/cadastro/view-models/use-cadastro-wizard.view-model";

interface CadastroWizardPageProps {
  searchParams: { evento?: string; token?: string; executivo?: string; associacao?: string };
}

export default async function CadastroWizardPage({ searchParams }: CadastroWizardPageProps) {
  const origem = searchParams.token ?? "direto";

  const [promotores, associacoesTodas] = await Promise.all([
    atribuicoesAdminController.listarPromotores(),
    atribuicoesAdminController.listarAssociacoes(),
  ]);

  const executivos: ExecutivoOption[] = promotores.map((promotor) => ({
    id: promotor.id,
    nome: promotor.nome,
  }));
  const associacoes: AssociacaoOption[] = associacoesTodas
    .filter((associacao) => associacao.ativo)
    .map((associacao) => ({ id: associacao.id, nome: associacao.nome }));

  const executivoResolvido = searchParams.executivo
    ? (promotores.find(
        (promotor) =>
          promotor.id === searchParams.executivo ||
          promotor.linkExecutivoId.includes(searchParams.executivo!),
      ) ?? null)
    : null;
  const executivoId = executivoResolvido?.id ?? null;

  const associacaoResolvida = searchParams.associacao
    ? (associacoes.find((associacao) => associacao.id === searchParams.associacao) ?? null)
    : null;
  const associacaoId = associacaoResolvida?.id ?? null;

  // `?evento=` é o slug (painel /eventos), não o id — Agencia.eventoId é FK
  // real pro id de verdade, então resolve o slug aqui e usa o id resolvido
  // daqui pra frente. O form público não exibe nem trava nenhum campo por
  // causa dele, só encaminha.
  const eventoResolvido = searchParams.evento
    ? await eventosAdminController.buscarEventoPorSlug(searchParams.evento)
    : null;
  const eventoId = eventoResolvido?.id ?? null;

  return (
    <CadastroWizardView
      origem={origem}
      executivoId={executivoId}
      associacaoId={associacaoId}
      eventoId={eventoId}
      executivos={executivos}
      associacoes={associacoes}
    />
  );
}
