import { CadastroWizardView } from "@/modules/cadastro/views/wizard/cadastro-wizard-view";

interface CadastroWizardPageProps {
  params: { slug: string };
  searchParams: { evento?: string };
}

export default function CadastroWizardPage({ params, searchParams }: CadastroWizardPageProps) {
  const origem = searchParams.evento ? `Evento: ${searchParams.evento}` : params.slug;

  return <CadastroWizardView origem={origem} />;
}
