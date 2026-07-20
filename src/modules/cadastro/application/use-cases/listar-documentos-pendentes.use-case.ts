import type { UseCase } from "@/modules/shared/application/use-case";
import { NotFoundError } from "@/modules/shared/domain/errors";
import type { AgenciaRepository } from "@/modules/cadastro/domain/repositories/agencia-repository";
import type { TipoDocumento } from "@/modules/cadastro/domain/enums";

export interface DocumentoPendenteView {
  id: string;
  tipo: TipoDocumento;
  nomeSocio: string | null;
  motivoReprovacao: string | null;
}

export interface DocumentosPendentesOutput {
  razaoSocial: string;
  documentosPendentes: DocumentoPendenteView[];
}

// Página pública de reenvio — expõe só o mínimo necessário pro cliente
// entender o que falta corrigir (razão social + tipo/motivo de cada
// documento reprovado). Reaproveita obterDetalhe (mesma leitura do
// dossiê do analista) só como fonte de dado interna: o restante do
// AgenciaDetalhe (CPF, telefone, dados bancários dos sócios) nunca sai
// deste use-case, já que essa página não tem autenticação.
export class ListarDocumentosPendentesUseCase implements UseCase<
  string,
  DocumentosPendentesOutput
> {
  constructor(private readonly agenciaRepository: AgenciaRepository) {}

  async execute(agenciaId: string): Promise<DocumentosPendentesOutput> {
    const detalhe = await this.agenciaRepository.obterDetalhe(agenciaId);

    if (!detalhe) {
      throw new NotFoundError("Agência");
    }

    const documentosPendentes: DocumentoPendenteView[] = [];

    if (detalhe.contratoSocial?.status === "REPROVADO") {
      documentosPendentes.push({
        id: detalhe.contratoSocial.id,
        tipo: detalhe.contratoSocial.tipo,
        nomeSocio: null,
        motivoReprovacao: detalhe.contratoSocial.motivoReprovacao,
      });
    }

    for (const socio of detalhe.representantesLegais) {
      if (socio.rg?.status === "REPROVADO") {
        documentosPendentes.push({
          id: socio.rg.id,
          tipo: socio.rg.tipo,
          nomeSocio: socio.nome,
          motivoReprovacao: socio.rg.motivoReprovacao,
        });
      }
      if (socio.procuracao?.status === "REPROVADO") {
        documentosPendentes.push({
          id: socio.procuracao.id,
          tipo: socio.procuracao.tipo,
          nomeSocio: socio.nome,
          motivoReprovacao: socio.procuracao.motivoReprovacao,
        });
      }
    }

    return { razaoSocial: detalhe.agencia.razaoSocial, documentosPendentes };
  }
}
