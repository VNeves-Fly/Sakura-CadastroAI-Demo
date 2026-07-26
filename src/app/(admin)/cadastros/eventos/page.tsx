import { EventosView } from "@/modules/eventos/components/eventos-view";
import { atribuicoesAdminController } from "@/modules/atribuicoes/presentation/controllers/atribuicoes-admin.controller";

export default async function EventosPage() {
  const [promotores, associacoesTodas] = await Promise.all([
    atribuicoesAdminController.listarPromotores(),
    atribuicoesAdminController.listarAssociacoes(),
  ]);

  const executivos = promotores.map((promotor) => ({ id: promotor.id, nome: promotor.nome }));
  const associacoes = associacoesTodas
    .filter((associacao) => associacao.ativo)
    .map((associacao) => ({ id: associacao.id, nome: associacao.nome }));

  return <EventosView executivos={executivos} associacoes={associacoes} />;
}
