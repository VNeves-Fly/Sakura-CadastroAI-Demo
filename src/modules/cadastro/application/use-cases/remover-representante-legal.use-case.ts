import type { UseCase } from "@/modules/shared/application/use-case";
import { ConflictError, DomainError, NotFoundError } from "@/modules/shared/domain/errors";
import type { RepresentanteLegal } from "@/modules/cadastro/domain/entities/representante-legal.entity";
import type { RepresentanteLegalRepository } from "@/modules/cadastro/domain/repositories/representante-legal-repository";
import type { HistoricoEdicaoCadastroRepository } from "@/modules/cadastro/domain/repositories/historico-edicao-cadastro-repository";

export interface RemoverRepresentanteLegalInput {
  id: string;
  justificativa: string;
  removidoPor: string;
}

// Soft delete (ativo=false, ver campo no schema) — some da ficha e de
// qualquer decisão de negócio derivada de AgenciaRepository.obterDetalhe
// (fila de assinatura, geração de contrato, Usuário Master etc.), mas a
// linha continua no banco pra auditoria. Mesma exigência de justificativa
// de AtualizarRepresentanteLegalUseCase (toda correção manual precisa do
// "quem/quando/por quê", decisão do usuário 2026-07-26), registrada no
// mesmo HistoricoEdicaoCadastro. Não existe "restaurar sócio" na UI hoje
// (diferente de SignatarioPadraoRepository.restaurar) — reverter exige
// acesso direto ao banco.
export class RemoverRepresentanteLegalUseCase implements UseCase<
  RemoverRepresentanteLegalInput,
  RepresentanteLegal
> {
  constructor(
    private readonly representanteLegalRepository: RepresentanteLegalRepository,
    private readonly historicoEdicaoCadastroRepository: HistoricoEdicaoCadastroRepository,
  ) {}

  async execute(input: RemoverRepresentanteLegalInput): Promise<RepresentanteLegal> {
    const atual = await this.representanteLegalRepository.findById(input.id);
    if (!atual) {
      throw new NotFoundError("Sócio");
    }

    if (!atual.ativo) {
      throw new ConflictError("Este sócio já foi removido.");
    }

    if (input.justificativa.trim().length === 0) {
      throw new DomainError("Informe a justificativa da remoção.");
    }

    // Nunca deixa a agência sem nenhum sócio ativo — isso derrubaria a
    // fila de assinatura/geração de contrato pra zero signatários.
    const demaisAtivos = (
      await this.representanteLegalRepository.findByAgenciaId(atual.agenciaId)
    ).filter((socio) => socio.ativo && socio.id !== atual.id);
    if (demaisAtivos.length === 0) {
      throw new ConflictError(
        "A agência precisa ter ao menos um sócio ativo — não é possível remover o último.",
      );
    }

    const removido = await this.representanteLegalRepository.update(input.id, { ativo: false });

    await this.historicoEdicaoCadastroRepository.create({
      agenciaId: atual.agenciaId,
      entidade: "RepresentanteLegal",
      entidadeId: input.id,
      alteracoes: { ativo: { de: "Ativo", para: "Removido" } },
      justificativa: input.justificativa.trim(),
      editadoPor: input.removidoPor,
    });

    return removido;
  }
}
