import type { UseCase } from "@/modules/shared/application/use-case";
import { NotFoundError } from "@/modules/shared/domain/errors";
import type { Endereco } from "@/modules/cadastro/domain/entities/endereco.entity";
import type { EnderecoRepository } from "@/modules/cadastro/domain/repositories/endereco-repository";

// O dono é sempre exatamente um dos três — ver endereco.entity.ts.
export type ObterEnderecoInput =
  | { donoTipo: "dadosReceita"; donoId: string }
  | { donoTipo: "cadastroComplementar"; donoId: string }
  | { donoTipo: "representanteLegal"; donoId: string };

export class ObterEnderecoUseCase implements UseCase<ObterEnderecoInput, Endereco> {
  constructor(private readonly enderecoRepository: EnderecoRepository) {}

  async execute(input: ObterEnderecoInput): Promise<Endereco> {
    const endereco = await this.buscarPorDono(input);

    if (!endereco) {
      throw new NotFoundError("Endereço");
    }

    return endereco;
  }

  private buscarPorDono({ donoTipo, donoId }: ObterEnderecoInput): Promise<Endereco | null> {
    switch (donoTipo) {
      case "dadosReceita":
        return this.enderecoRepository.findByDadosReceitaId(donoId);
      case "cadastroComplementar":
        return this.enderecoRepository.findByCadastroComplementarId(donoId);
      case "representanteLegal":
        return this.enderecoRepository.findByRepresentanteLegalId(donoId);
    }
  }
}
