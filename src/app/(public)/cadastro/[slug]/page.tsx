import { CadastroAgenciaView } from "@/modules/cadastro/views/link1/cadastro-agencia-view";

interface CadastroAgenciaPageProps {
  params: { slug: string };
  searchParams: { evento?: string };
}

export default function CadastroAgenciaPage({ params, searchParams }: CadastroAgenciaPageProps) {
  const origem = searchParams.evento ? `Evento: ${searchParams.evento}` : params.slug;

  return <CadastroAgenciaView origem={origem} />;
}
