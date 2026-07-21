import type { UseCase } from "@/modules/shared/application/use-case";
import type { DadosReceita } from "@/modules/cadastro/domain/entities/dados-receita.entity";
import type { DadosReceitaRepository } from "@/modules/cadastro/domain/repositories/dados-receita-repository";

// `null` aqui é o estado normal de uma agência cadastrada antes desta
// funcionalidade existir (ou de uma gravação best-effort que falhou no
// FinalizarCadastroUseCase) — não é um erro "não encontrado".
export class ObterDadosReceitaUseCase implements UseCase<string, DadosReceita | null> {
  constructor(private readonly dadosReceitaRepository: DadosReceitaRepository) {}

  execute(agenciaId: string): Promise<DadosReceita | null> {
    return this.dadosReceitaRepository.findByAgenciaId(agenciaId);
  }
}
