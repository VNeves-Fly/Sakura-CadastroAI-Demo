import { CadastroWizardView } from "@/modules/cadastro/views/wizard/cadastro-wizard-view";

interface CadastroWizardPageProps {
  searchParams: { evento?: string; token?: string; executivo?: string };
}

export default function CadastroWizardPage({ searchParams }: CadastroWizardPageProps) {
  const origem = searchParams.evento
    ? `Evento: ${searchParams.evento}`
    : (searchParams.token ?? "direto");

  // uuid do link pessoal de um promotor (ver Promotor.linkExecutivoId)
  // — atribui a agência a esse executivo/gestor automaticamente.
  const promotorLinkId = searchParams.executivo ?? null;

  return <CadastroWizardView origem={origem} promotorLinkId={promotorLinkId} />;
}
