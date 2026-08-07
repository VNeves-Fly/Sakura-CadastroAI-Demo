import type { UseCase } from "@/modules/shared/application/use-case";
import { DomainError, NotFoundError } from "@/modules/shared/domain/errors";
import type { CadastroComplementarRepository } from "@/modules/cadastro/domain/repositories/cadastro-complementar-repository";
import type { HistoricoEdicaoCadastroRepository } from "@/modules/cadastro/domain/repositories/historico-edicao-cadastro-repository";
import type { AlteracaoCampo } from "@/modules/cadastro/domain/entities/historico-edicao-cadastro.entity";
import type { CadastroComplementar } from "@/modules/cadastro/domain/entities/cadastro-complementar.entity";

export interface EditarDadosBancariosInput {
  agenciaId: string;
  editadoPor: string;
  justificativa: string;
  dadosBancarios: {
    bancoPais?: string | null;
    bancoNome?: string | null;
    bancoCodigo?: string | null;
    bancoAgencia?: string | null;
    bancoConta?: string | null;
    bancoSwift?: string | null;
    tipoConta?: string | null;
    favorecidoEhEmpresa?: boolean | null;
    favorecidoNome?: string | null;
    favorecidoDoc?: string | null;
  };
}

function paraTextoDiff(valor: unknown): string | null {
  if (valor === null || valor === undefined) return null;
  return String(valor);
}

function calcularAlteracoes<T extends Record<string, unknown>>(
  atual: T,
  dados: Partial<T>,
): Record<string, AlteracaoCampo> {
  const alteracoes: Record<string, AlteracaoCampo> = {};

  for (const campo of Object.keys(dados) as Array<keyof T & string>) {
    const textoAtual = paraTextoDiff(atual[campo]);
    const textoNovo = paraTextoDiff(dados[campo]);
    if (textoAtual !== textoNovo) {
      alteracoes[campo] = { de: textoAtual, para: textoNovo };
    }
  }

  return alteracoes;
}

// Edição pelo analista dos dados bancários de recebimento (todos campos
// soltos em CadastroComplementar, ver schema.prisma), com justificativa
// obrigatória — mesmo padrão de EditarDadosEmpresaUseCase, só que restrito
// à seção "Banco" da ficha em vez da agência/endereço.
export class EditarDadosBancariosUseCase implements UseCase<
  EditarDadosBancariosInput,
  CadastroComplementar
> {
  constructor(
    private readonly cadastroComplementarRepository: CadastroComplementarRepository,
    private readonly historicoEdicaoCadastroRepository: HistoricoEdicaoCadastroRepository,
  ) {}

  async execute(input: EditarDadosBancariosInput): Promise<CadastroComplementar> {
    const complementarAtual = await this.cadastroComplementarRepository.findByAgenciaId(
      input.agenciaId,
    );
    if (!complementarAtual) {
      throw new NotFoundError("Cadastro complementar");
    }

    if (input.justificativa.trim().length === 0) {
      throw new DomainError("Informe a justificativa da edição.");
    }

    const alteracoes = calcularAlteracoes(
      {
        bancoPais: complementarAtual.bancoPais,
        bancoNome: complementarAtual.bancoNome,
        bancoCodigo: complementarAtual.bancoCodigo,
        bancoAgencia: complementarAtual.bancoAgencia,
        bancoConta: complementarAtual.bancoConta,
        bancoSwift: complementarAtual.bancoSwift,
        tipoConta: complementarAtual.tipoConta,
        favorecidoEhEmpresa: complementarAtual.favorecidoEhEmpresa,
        favorecidoNome: complementarAtual.favorecidoNome,
        favorecidoDoc: complementarAtual.favorecidoDoc,
      },
      input.dadosBancarios,
    );

    if (Object.keys(alteracoes).length === 0) {
      return complementarAtual;
    }

    const complementar = await this.cadastroComplementarRepository.update(
      input.agenciaId,
      input.dadosBancarios,
    );

    await this.historicoEdicaoCadastroRepository.create({
      agenciaId: input.agenciaId,
      entidade: "CadastroComplementar",
      entidadeId: complementarAtual.id,
      alteracoes,
      justificativa: input.justificativa.trim(),
      editadoPor: input.editadoPor,
    });

    return complementar;
  }
}
