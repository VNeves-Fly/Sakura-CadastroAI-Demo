import type { UseCase } from "@/modules/shared/application/use-case";
import { ConflictError } from "@/modules/shared/domain/errors";
import {
  STATUS_AGUARDANDO_ASSINATURA,
  STATUS_EM_COMPLEMENTAR,
  type AgenciaRepository,
} from "@/modules/cadastro/domain/repositories/agencia-repository";
import type { FileStorage } from "@/modules/cadastro/domain/services/file-storage";
import type { QsaConsultaService } from "@/modules/cadastro/domain/services/qsa-consulta-service";
import type { ContratoAssinaturaService } from "@/modules/cadastro/domain/services/contrato-assinatura-service";
import type { AnaliseIaService } from "@/modules/cadastro/domain/services/analise-ia-service";
import type { DocumentAnalysisService } from "@/modules/cadastro/domain/services/document-analysis-service";
import type {
  EnderecoInput,
  FinalizarCadastroInput,
  FinalizarCadastroOutput,
} from "@/modules/cadastro/application/dto/finalizar-cadastro.dto";

const ENDERECO_VAZIO: EnderecoInput = {
  cep: "",
  logradouro: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade: "",
  uf: "",
};

export class FinalizarCadastroUseCase implements UseCase<
  FinalizarCadastroInput,
  FinalizarCadastroOutput
> {
  constructor(
    private readonly agenciaRepository: AgenciaRepository,
    private readonly fileStorage: FileStorage,
    private readonly qsaConsultaService: QsaConsultaService,
    private readonly contratoAssinaturaService: ContratoAssinaturaService,
    private readonly analiseIaService: AnaliseIaService,
    private readonly documentAnalysisService: DocumentAnalysisService,
  ) {}

  async execute(input: FinalizarCadastroInput): Promise<FinalizarCadastroOutput> {
    const existingAgencia = await this.agenciaRepository.findByCnpj(input.cnpj);

    if (existingAgencia) {
      throw new ConflictError("Esta agência já está cadastrada.");
    }

    // Reconsulta o QSA no servidor pra ter a razão social a partir de
    // uma fonte autoritativa, em vez de confiar no que o cliente enviou.
    const qsaResult = await this.qsaConsultaService.consultar(input.cnpj);
    const razaoSocial = qsaResult?.razaoSocial ?? input.cnpj;

    const contratoSocialPath = await this.fileStorage.save(
      input.contratoSocial,
      `agencias/${input.cnpj}/contrato-social`,
    );

    const socios = await Promise.all(
      input.socios.map(async (socio, index) => {
        const rgPath = await this.fileStorage.save(
          socio.rg,
          `agencias/${input.cnpj}/socio-${index}-rg`,
        );

        const procuracaoPath = socio.procuracao
          ? await this.fileStorage.save(
              socio.procuracao,
              `agencias/${input.cnpj}/socio-${index}-procuracao`,
            )
          : null;

        return {
          nome: socio.nome,
          cpf: socio.cpf,
          email: socio.email,
          telefone: socio.telefone,
          estadoCivil: socio.estadoCivil,
          endereco: socio.endereco,
          isRepresentante: socio.isRepresentante,
          rgPath,
          procuracaoPath,
        };
      }),
    );

    const signatarios = socios.map((socio) => ({
      nome: socio.nome,
      email: socio.email,
      cpf: socio.cpf,
    }));

    // "Aquece" a sessão de análise (session_id = cnpj) com cada documento
    // individual antes da avaliação final — o agents-service compartilha o
    // checkpoint do LangGraph por session_id, então a chamada final de
    // analiseIaService.avaliar() já enxerga esse contexto. Sequencial (não
    // Promise.all) porque as chamadas dividem o mesmo thread_id no agente;
    // rodar em paralelo arriscaria concorrência no checkpoint.
    await this.documentAnalysisService.analisar({
      cnpj: input.cnpj,
      documentPath: contratoSocialPath,
      documentType: "contrato_social",
    });
    for (const socio of socios) {
      await this.documentAnalysisService.analisar({
        cnpj: input.cnpj,
        documentPath: socio.rgPath,
        documentType: "cnh_rg",
      });
    }

    // A IA avalia o cadastro logo no envio: se achar algo errado, o caso
    // vai pra fila "em_complementar" (revisão manual, sem contrato ainda
    // — um analista entra em contato por telefone/e-mail); se estiver
    // tudo certo, gera e envia o contrato na hora (fila
    // "aguardando_assinatura"). Chamado antes de gravar no banco: se o
    // D4Sign falhar quando a IA aprova, nada é persistido.
    const analiseIa = await this.analiseIaService.avaliar({
      cnpj: input.cnpj,
      razaoSocial,
      contratoSocialPath,
      socios: socios.map((socio) => ({
        nome: socio.nome,
        cpf: socio.cpf,
        rgPath: socio.rgPath,
        procuracaoPath: socio.procuracaoPath,
      })),
    });

    // Quando o endereço da agência é "o mesmo do sócio", o formulário não
    // manda um endereço próprio (`enderecoBanco.endereco` vem null) — copia
    // do sócio vinculado, já que agora existe uma linha real de endereço
    // por sócio pra copiar (antes ficava null dentro do JSON). Calculado
    // antes do contrato porque o gerador de contrato precisa do endereço
    // pra preencher o template.
    const enderecoAgencia =
      (input.enderecoBanco.enderecoMesmoSocio
        ? socios[input.enderecoBanco.socioEnderecoVinculado ?? -1]?.endereco
        : input.enderecoBanco.endereco) ?? ENDERECO_VAZIO;

    const contratoResult = analiseIa.aprovado
      ? await this.contratoAssinaturaService.gerarEEnviar({
          cnpj: input.cnpj,
          razaoSocial,
          origem: input.origem,
          endereco: enderecoAgencia,
          signatarios,
        })
      : null;

    const agencia = await this.agenciaRepository.create({
      razaoSocial,
      cnpj: input.cnpj,
      status: contratoResult ? STATUS_AGUARDANDO_ASSINATURA : STATUS_EM_COMPLEMENTAR,
      contratoSocialPath,
      emailContato: input.emailOperacional,
      telefoneContato: input.telefoneComercial,
      origem: input.origem,
      empresa: {
        telefoneComercial: input.telefoneComercial,
        emailOperacional: input.emailOperacional,
        emailComercial: input.emailComercial,
        emailFinanceiro: input.emailFinanceiro,
      },
      socios: socios.map((socio) => ({
        nome: socio.nome,
        cpf: socio.cpf,
        email: socio.email,
        telefone: socio.telefone,
        estadoCivil: socio.estadoCivil,
        endereco: socio.endereco,
        isRepresentanteLegal: socio.isRepresentante,
        rgPath: socio.rgPath,
        procuracaoPath: socio.procuracaoPath,
      })),
      enderecoBanco: {
        enderecoMesmoSocio: input.enderecoBanco.enderecoMesmoSocio,
        socioEnderecoVinculadoIndex: input.enderecoBanco.socioEnderecoVinculado,
        endereco: enderecoAgencia,
        bancoPais: input.enderecoBanco.bancoPais,
        bancoNome: input.enderecoBanco.bancoNome,
        bancoAgencia: input.enderecoBanco.bancoAgencia,
        bancoConta: input.enderecoBanco.bancoConta,
        bancoSwift: input.enderecoBanco.bancoSwift,
        tipoConta: input.enderecoBanco.tipoConta,
        favorecidoEhEmpresa: input.enderecoBanco.favorecidoEhEmpresa,
        favorecidoNome: input.enderecoBanco.favorecidoNome,
        favorecidoDoc: input.enderecoBanco.favorecidoDoc,
      },
      contrato: contratoResult
        ? {
            provedorId: contratoResult.provedorId,
            status: contratoResult.status,
            origemGeracao: "ia",
            signatarios,
          }
        : null,
    });

    return {
      id: agencia.id,
      cnpj: agencia.cnpj,
      razaoSocial: agencia.razaoSocial,
      status: agencia.status,
      precisaRevisaoManual: !analiseIa.aprovado,
      contratoStatus: contratoResult?.status ?? null,
    };
  }
}
