import { CadastroWizardView } from "@/modules/cadastro/views/wizard/cadastro-wizard-view";

interface CadastroWizardPageProps {
  searchParams: { evento?: string; token?: string };
}

export default function CadastroWizardPage({ searchParams }: CadastroWizardPageProps) {
  const origem = searchParams.evento
    ? `Evento: ${searchParams.evento}`
    : (searchParams.token ?? "direto");

  return <CadastroWizardView origem={origem} />;
}
