import type { UseCase } from "@/modules/shared/application/use-case";
import { DomainError, NotFoundError } from "@/modules/shared/domain/errors";
import type {
  AgenciaRepository,
  EnderecoData,
} from "@/modules/cadastro/domain/repositories/agencia-repository";
import type { CadastroComplementarRepository } from "@/modules/cadastro/domain/repositories/cadastro-complementar-repository";
import type { EnderecoRepository } from "@/modules/cadastro/domain/repositories/endereco-repository";
import type { HistoricoEdicaoCadastroRepository } from "@/modules/cadastro/domain/repositories/historico-edicao-cadastro-repository";
import type { AlteracaoCampo } from "@/modules/cadastro/domain/entities/historico-edicao-cadastro.entity";
import type { Agencia } from "@/modules/cadastro/domain/entities/agencia.entity";
import type { CadastroComplementar } from "@/modules/cadastro/domain/entities/cadastro-complementar.entity";

export interface EditarDadosEmpresaInput {
  agenciaId: string;
  editadoPor: string;
  justificativa: string;
  dadosAgencia?: {
    razaoSocial?: string;
    nomeFantasia?: string | null;
    emailContato?: string;
    telefoneContato?: string;
  };
  dadosComplementar?: {
    telefoneComercial?: string | null;
    emailOperacional?: string | null;
    emailComercial?: string | null;
    emailFinanceiro?: string | null;
  };
  // Endereço da própria empresa (CadastroComplementar.enderecoAgencia) —
  // separado de `dadosComplementar` porque mora numa entidade Endereco à
  // parte (mesmo relacionamento 1:1 usado por sócio/DadosReceita, ver
  // EnderecoRepository), não em colunas soltas do CadastroComplementar.
  enderecoAgencia?: EnderecoData;
}

export interface EditarDadosEmpresaResultado {
  agencia: Agencia;
  complementar: CadastroComplementar | null;
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

// Edição em lote dos dados "de cadastro" da empresa (Agencia +
// CadastroComplementar + Endereco da agência) pelo analista, com
// justificativa obrigatória — mesmo padrão de EditarRepresentanteLegalUseCase.
// Nunca toca DadosReceita (o dado oficial da Receita Federal): este use
// case simplesmente não aceita esses campos como input, então o valor
// oficial fica estruturalmente inalterável por aqui — só leitura na tela
// (ver EditarEmpresaForm). Pode alterar as três entidades na mesma chamada;
// grava uma linha de HistoricoEdicaoCadastro por entidade que realmente
// mudou (endereço entra sob "CadastroComplementar", mesma entidade dona do
// relacionamento).
export class EditarDadosEmpresaUseCase implements UseCase<
  EditarDadosEmpresaInput,
  EditarDadosEmpresaResultado
> {
  constructor(
    private readonly agenciaRepository: AgenciaRepository,
    private readonly cadastroComplementarRepository: CadastroComplementarRepository,
    private readonly enderecoRepository: EnderecoRepository,
    private readonly historicoEdicaoCadastroRepository: HistoricoEdicaoCadastroRepository,
  ) {}

  async execute(input: EditarDadosEmpresaInput): Promise<EditarDadosEmpresaResultado> {
    const agenciaAtual = await this.agenciaRepository.findById(input.agenciaId);
    if (!agenciaAtual) {
      throw new NotFoundError("Agência");
    }

    if (input.justificativa.trim().length === 0) {
      throw new DomainError("Informe a justificativa da edição.");
    }

    const justificativa = input.justificativa.trim();
    let agencia = agenciaAtual;
    let complementar = await this.cadastroComplementarRepository.findByAgenciaId(input.agenciaId);

    if (input.dadosAgencia) {
      const alteracoes = calcularAlteracoes(
        {
          razaoSocial: agenciaAtual.razaoSocial,
          nomeFantasia: agenciaAtual.nomeFantasia,
          emailContato: agenciaAtual.emailContato,
          telefoneContato: agenciaAtual.telefoneContato,
        },
        input.dadosAgencia,
      );

      if (Object.keys(alteracoes).length > 0) {
        agencia = await this.agenciaRepository.atualizarDadosCadastrais(
          input.agenciaId,
          input.dadosAgencia,
        );
        await this.historicoEdicaoCadastroRepository.create({
          agenciaId: input.agenciaId,
          entidade: "Agencia",
          entidadeId: input.agenciaId,
          alteracoes,
          justificativa,
          editadoPor: input.editadoPor,
        });
      }
    }

    if (input.dadosComplementar && complementar) {
      const alteracoes = calcularAlteracoes(
        {
          telefoneComercial: complementar.telefoneComercial,
          emailOperacional: complementar.emailOperacional,
          emailComercial: complementar.emailComercial,
          emailFinanceiro: complementar.emailFinanceiro,
        },
        input.dadosComplementar,
      );

      if (Object.keys(alteracoes).length > 0) {
        const complementarId = complementar.id;
        complementar = await this.cadastroComplementarRepository.update(
          input.agenciaId,
          input.dadosComplementar,
        );
        await this.historicoEdicaoCadastroRepository.create({
          agenciaId: input.agenciaId,
          entidade: "CadastroComplementar",
          entidadeId: complementarId,
          alteracoes,
          justificativa,
          editadoPor: input.editadoPor,
        });
      }
    }

    if (input.enderecoAgencia && complementar) {
      const enderecoAtual = await this.enderecoRepository.findByCadastroComplementarId(
        complementar.id,
      );

      const alteracoes = calcularAlteracoes(
        {
          cep: enderecoAtual?.cep ?? null,
          logradouro: enderecoAtual?.logradouro ?? null,
          numero: enderecoAtual?.numero ?? null,
          complemento: enderecoAtual?.complemento ?? null,
          bairro: enderecoAtual?.bairro ?? null,
          cidade: enderecoAtual?.cidade ?? null,
          uf: enderecoAtual?.uf ?? null,
        },
        input.enderecoAgencia,
      );

      if (Object.keys(alteracoes).length > 0) {
        if (enderecoAtual) {
          await this.enderecoRepository.update(enderecoAtual.id, input.enderecoAgencia);
        } else {
          // Cadastros antigos podem não ter uma linha de Endereco ainda
          // (nem todo CadastroComplementar tinha esse relacionamento
          // preenchido) — cria na primeira edição em vez de exigir que já
          // exista.
          await this.enderecoRepository.create({
            ...input.enderecoAgencia,
            cadastroComplementarId: complementar.id,
          });
        }

        await this.historicoEdicaoCadastroRepository.create({
          agenciaId: input.agenciaId,
          entidade: "CadastroComplementar",
          entidadeId: complementar.id,
          alteracoes,
          justificativa,
          editadoPor: input.editadoPor,
        });
      }
    }

    return { agencia, complementar };
  }
}
