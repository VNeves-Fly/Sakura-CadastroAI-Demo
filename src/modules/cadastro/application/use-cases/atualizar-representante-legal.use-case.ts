import type { UseCase } from "@/modules/shared/application/use-case";
import { DomainError, NotFoundError } from "@/modules/shared/domain/errors";
import type { RepresentanteLegal } from "@/modules/cadastro/domain/entities/representante-legal.entity";
import type {
  RepresentanteLegalRepository,
  UpdateRepresentanteLegalData,
} from "@/modules/cadastro/domain/repositories/representante-legal-repository";
import type { HistoricoEdicaoCadastroRepository } from "@/modules/cadastro/domain/repositories/historico-edicao-cadastro-repository";
import type { AlteracaoCampo } from "@/modules/cadastro/domain/entities/historico-edicao-cadastro.entity";

export interface AtualizarRepresentanteLegalInput {
  id: string;
  editadoPor: string;
  justificativa: string;
  dados: UpdateRepresentanteLegalData;
}

// Campos que o analista pode editar em lote pelo dossiê — mesmo conjunto
// exibido no card do sócio (ver dossie-campos.tsx/page.tsx). De propósito
// não inclui papel/origem/preenchidoPorIa/ativo (gerenciados pelo sistema,
// não pelo analista) nem cnpj/isPj/regimeBens (roadmap, sem UI hoje).
const CAMPOS_EDITAVEIS = [
  "nome",
  "cpf",
  "email",
  "telefone",
  "estadoCivil",
  "nacionalidade",
  "rg",
  "rgOrgaoEmissor",
  "dataNascimento",
  "cargo",
  "administrativo",
] as const;

function paraTextoDiff(valor: unknown): string | null {
  if (valor === null || valor === undefined) return null;
  if (valor instanceof Date) return valor.toISOString();
  return String(valor);
}

function calcularAlteracoes(
  atual: RepresentanteLegal,
  dados: UpdateRepresentanteLegalData,
): Record<string, AlteracaoCampo> {
  const alteracoes: Record<string, AlteracaoCampo> = {};

  for (const campo of CAMPOS_EDITAVEIS) {
    if (!(campo in dados)) continue;

    const textoAtual = paraTextoDiff(atual[campo]);
    const textoNovo = paraTextoDiff(dados[campo]);

    if (textoAtual !== textoNovo) {
      alteracoes[campo] = { de: textoAtual, para: textoNovo };
    }
  }

  return alteracoes;
}

// Ação do analista no painel: edição em lote dos dados do sócio extraídos
// pela IA (ou preenchidos no wizard), com justificativa obrigatória —
// mesma exigência aplicada a aprovar/reprovar documento (decisão do
// usuário, 2026-07-26: toda correção manual precisa do "quem/quando/por
// quê"). Substitui o antigo fluxo de só alternar `administrativo`
// (SocioAdministrativoToggle), que agora é só mais um campo deste form.
// Se nada mudou de fato (diff vazio), não grava nada — não é uma edição
// de verdade só porque o form foi submetido.
export class AtualizarRepresentanteLegalUseCase implements UseCase<
  AtualizarRepresentanteLegalInput,
  RepresentanteLegal
> {
  constructor(
    private readonly representanteLegalRepository: RepresentanteLegalRepository,
    private readonly historicoEdicaoCadastroRepository: HistoricoEdicaoCadastroRepository,
  ) {}

  async execute(input: AtualizarRepresentanteLegalInput): Promise<RepresentanteLegal> {
    const atual = await this.representanteLegalRepository.findById(input.id);
    if (!atual) {
      throw new NotFoundError("Sócio");
    }

    if (input.justificativa.trim().length === 0) {
      throw new DomainError("Informe a justificativa da edição.");
    }

    const alteracoes = calcularAlteracoes(atual, input.dados);
    if (Object.keys(alteracoes).length === 0) {
      return atual;
    }

    const atualizado = await this.representanteLegalRepository.update(input.id, input.dados);

    await this.historicoEdicaoCadastroRepository.create({
      agenciaId: atual.agenciaId,
      entidade: "RepresentanteLegal",
      entidadeId: input.id,
      alteracoes,
      justificativa: input.justificativa.trim(),
      editadoPor: input.editadoPor,
    });

    return atualizado;
  }
}
