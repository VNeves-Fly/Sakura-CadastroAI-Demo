import type { UseCase } from "@/modules/shared/application/use-case";
import { ConflictError, DomainError } from "@/modules/shared/domain/errors";
import type { RepresentanteLegal } from "@/modules/cadastro/domain/entities/representante-legal.entity";
import type { RepresentanteLegalRepository } from "@/modules/cadastro/domain/repositories/representante-legal-repository";

export interface CriarRepresentanteLegalInput {
  agenciaId: string;
  nome: string;
  cpf: string;
  email: string;
  telefone: string;
  estadoCivil: string;
  nacionalidade: string | null;
  rg: string | null;
  rgOrgaoEmissor: string | null;
  dataNascimento: Date | null;
  administrativo: boolean;
}

// Sócio incluído manualmente pelo analista direto no dossiê ("Adicionar
// sócio") — mesmo conjunto de campos do form de edição em lote (ver
// AtualizarRepresentanteLegalUseCase/CAMPOS_EDITAVEIS). Sem justificativa/
// histórico: diferente de editar ou remover, incluir um sócio que faltou
// não é uma correção de um dado já existente.
export class CriarRepresentanteLegalUseCase implements UseCase<
  CriarRepresentanteLegalInput,
  RepresentanteLegal
> {
  constructor(private readonly representanteLegalRepository: RepresentanteLegalRepository) {}

  async execute(input: CriarRepresentanteLegalInput): Promise<RepresentanteLegal> {
    if (
      !input.nome.trim() ||
      !input.cpf.trim() ||
      !input.email.trim() ||
      !input.telefone.trim() ||
      !input.estadoCivil.trim()
    ) {
      throw new DomainError("Preencha nome, CPF, e-mail, telefone e estado civil do sócio.");
    }

    // Mesma regra do wizard público (CPF não pode se repetir DENTRO da
    // mesma agência, ver comentário do índice em RepresentanteLegal no
    // schema) — aqui não existe validação de formulário anterior, então
    // o use case precisa garantir sozinho. Um sócio já removido
    // (ativo=false) com o mesmo CPF não bloqueia — é o mesmo CPF voltando
    // ao quadro societário, não uma duplicata ativa.
    const existente = await this.representanteLegalRepository.findByAgenciaIdAndCpf(
      input.agenciaId,
      input.cpf,
    );
    if (existente?.ativo) {
      throw new ConflictError("Já existe um sócio ativo com este CPF nesta agência.");
    }

    return this.representanteLegalRepository.create({
      agenciaId: input.agenciaId,
      nome: input.nome,
      cpf: input.cpf,
      email: input.email,
      telefone: input.telefone,
      estadoCivil: input.estadoCivil,
      nacionalidade: input.nacionalidade,
      rg: input.rg,
      rgOrgaoEmissor: input.rgOrgaoEmissor,
      dataNascimento: input.dataNascimento,
      administrativo: input.administrativo,
    });
  }
}
