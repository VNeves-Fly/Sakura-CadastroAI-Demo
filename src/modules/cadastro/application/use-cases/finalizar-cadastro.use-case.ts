import type { UseCase } from "@/modules/shared/application/use-case";
import { ConflictError } from "@/modules/shared/domain/errors";
import {
  STATUS_AGUARDANDO_ASSINATURA,
  STATUS_EM_COMPLEMENTAR,
  type AgenciaRepository,
} from "@/modules/cadastro/domain/repositories/agencia-repository";
import type { DadosReceitaRepository } from "@/modules/cadastro/domain/repositories/dados-receita-repository";
import type { ExecutivoResolver } from "@/modules/cadastro/domain/repositories/executivo-resolver";
import type { DadosReceitaEndereco } from "@/modules/cadastro/domain/entities/dados-receita.entity";
import type { FileStorage } from "@/modules/cadastro/domain/services/file-storage";
import type { ContratoAssinaturaService } from "@/modules/cadastro/domain/services/contrato-assinatura-service";
import type { AnaliseIaService } from "@/modules/cadastro/domain/services/analise-ia-service";
import type {
  DocumentAnalysisResultado,
  DocumentAnalysisService,
} from "@/modules/cadastro/domain/services/document-analysis-service";
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

// Mesma normalização usada em analisar-contrato-social.use-case.ts —
// capital social pode vir como número ou string em formato BR ("100.000,00").
function extrairCapitalSocial(valor: unknown): number | null {
  if (typeof valor === "number" && Number.isFinite(valor)) return valor;
  if (typeof valor !== "string") return null;

  const normalizado = valor.replace(/\./g, "").replace(",", ".");
  const numero = Number(normalizado);
  return Number.isFinite(numero) ? numero : null;
}

function extrairString(valor: unknown): string | null {
  return typeof valor === "string" && valor.length > 0 ? valor : null;
}

// `endereco` do contrato social é um objeto confirmado no schema do agente
// (cep/logradouro/numero/complemento/bairro/municipio/uf) — mapeia pro
// shape de DadosReceitaEndereco (campo "cidade", não "municipio").
function extrairEnderecoContratoSocial(valor: unknown): DadosReceitaEndereco | null {
  if (typeof valor !== "object" || valor === null) return null;
  const registro = valor as Record<string, unknown>;

  const endereco: DadosReceitaEndereco = {
    cep: extrairString(registro.cep),
    logradouro: extrairString(registro.logradouro),
    numero: extrairString(registro.numero),
    complemento: extrairString(registro.complemento),
    bairro: extrairString(registro.bairro),
    cidade: extrairString(registro.municipio),
    uf: extrairString(registro.uf),
  };

  const temAlgumCampo = Object.values(endereco).some((campo) => campo !== null);
  return temAlgumCampo ? endereco : null;
}

export class FinalizarCadastroUseCase implements UseCase<
  FinalizarCadastroInput,
  FinalizarCadastroOutput
> {
  constructor(
    private readonly agenciaRepository: AgenciaRepository,
    private readonly fileStorage: FileStorage,
    private readonly contratoAssinaturaService: ContratoAssinaturaService,
    private readonly analiseIaService: AnaliseIaService,
    private readonly documentAnalysisService: DocumentAnalysisService,
    private readonly dadosReceitaRepository: DadosReceitaRepository,
    private readonly executivoResolver: ExecutivoResolver,
  ) {}

  async execute(input: FinalizarCadastroInput): Promise<FinalizarCadastroOutput> {
    const existingAgencia = await this.agenciaRepository.findByCnpj(input.cnpj);

    if (existingAgencia) {
      throw new ConflictError("Esta agência já está cadastrada.");
    }

    // Razão social extraída do contrato social durante o preenchimento (o
    // mesmo valor que o usuário viu na revisão) — não reconsulta nada aqui,
    // evita divergência entre o que foi revisado e o que é persistido.
    const razaoSocial = input.razaoSocial || input.cnpj;

    const contratoSocialSalvo = await this.fileStorage.save(
      input.contratoSocial,
      `agencias/${input.cnpj}/contrato-social`,
    );
    const contratoSocialPath = contratoSocialSalvo.path;

    const socios = await Promise.all(
      input.socios.map(async (socio, index) => {
        const rgSalvo = await this.fileStorage.save(
          socio.rg,
          `agencias/${input.cnpj}/socio-${index}-rg`,
        );

        const procuracaoSalva = socio.procuracao
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
          dataNascimento: socio.dataNascimento,
          estadoCivil: socio.estadoCivil,
          endereco: socio.endereco,
          isRepresentante: socio.isRepresentante,
          rgPath: rgSalvo.path,
          rgBucket: rgSalvo.bucket,
          procuracaoPath: procuracaoSalva?.path ?? null,
          procuracaoBucket: procuracaoSalva?.bucket ?? null,
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
    // rodar em paralelo arriscaria concorrência no checkpoint. Os
    // resultados são guardados aqui e persistidos por
    // agenciaRepository.create() (precisa do id real do Documento, gerado
    // só dentro daquela transação).
    const analiseIaContratoSocial = await this.documentAnalysisService.analisar({
      cnpj: input.cnpj,
      documentPath: contratoSocialPath,
      documentType: "contrato_social",
    });
    const analisesIaSociosPorCpf = new Map<string, DocumentAnalysisResultado>();
    for (const socio of socios) {
      const analiseIaSocio = await this.documentAnalysisService.analisar({
        cnpj: input.cnpj,
        documentPath: socio.rgPath,
        documentType: "doc_identificacao",
      });
      analisesIaSociosPorCpf.set(socio.cpf, analiseIaSocio);
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
      email: input.emailOperacional,
      socios: socios.map((socio) => ({
        nome: socio.nome,
        cpf: socio.cpf,
        dataNascimento: socio.dataNascimento,
        rgPath: socio.rgPath,
        // Garantido: todo sócio passou pelo loop de documentAnalysisService
        // acima antes de chegar aqui.
        rgAnalise: analisesIaSociosPorCpf.get(socio.cpf)!,
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

    // `input.executivoId` pode ser o Promotor.id direto (vindo de um link
    // de Evento) ou o uuid pessoal do link antigo (Promotor.linkExecutivoId)
    // — o resolver aceita os dois formatos e sempre devolve o id canônico.
    const executivoId = input.executivoId
      ? await this.executivoResolver.resolve(input.executivoId)
      : null;

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
      contratoSocialBucket: contratoSocialSalvo.bucket,
      emailContato: input.emailOperacional,
      telefoneContato: input.telefoneComercial,
      origem: input.origem,
      executivoId,
      associacaoId: input.associacaoId,
      eventoId: input.eventoId,
      empresa: {
        telefoneComercial: input.telefoneComercial,
        emailOperacional: input.emailOperacional,
        emailComercial: input.emailComercial,
        emailFinanceiro: input.emailFinanceiro,
      },
      analiseIaContratoSocial,
      analiseIaFinal: analiseIa,
      socios: socios.map((socio) => ({
        nome: socio.nome,
        cpf: socio.cpf,
        email: socio.email,
        telefone: socio.telefone,
        dataNascimento: new Date(`${socio.dataNascimento}T00:00:00`),
        estadoCivil: socio.estadoCivil,
        endereco: socio.endereco,
        isRepresentanteLegal: socio.isRepresentante,
        rgPath: socio.rgPath,
        rgBucket: socio.rgBucket,
        procuracaoPath: socio.procuracaoPath,
        procuracaoBucket: socio.procuracaoBucket,
        analiseIa: analisesIaSociosPorCpf.get(socio.cpf) ?? null,
      })),
      enderecoBanco: {
        enderecoMesmoSocio: input.enderecoBanco.enderecoMesmoSocio,
        socioEnderecoVinculadoIndex: input.enderecoBanco.socioEnderecoVinculado,
        endereco: enderecoAgencia,
        bancoPais: input.enderecoBanco.bancoPais,
        bancoNome: input.enderecoBanco.bancoNome,
        bancoCodigo: input.enderecoBanco.bancoCodigo,
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

    // Cache normalizado pro dossiê do painel admin ("Dados da Receita") —
    // best-effort: a agência já foi criada com sucesso acima, então uma
    // falha aqui nunca deve derrubar o cadastro, só fica sem esse dado
    // suplementar. Fonte trocou de ReceitaWS direto pra duas origens que já
    // rodam no fluxo normal: situação cadastral vem da Stage 1 do
    // /agency-analysis/sync (dado oficial que o AgentsService já busca);
    // capital social e endereço vêm do próprio contrato social (não têm
    // contrapartida "oficial" na Stage 1 hoje). naturezaJuridica/porte/
    // telefone/email/optanteSimples/dataOpcaoSimples/cnaes ficam sem fonte
    // — gap aceito, ver docs/agency-analysis se algum dia isso entrar na
    // Stage 1.
    const capitalSocial = extrairCapitalSocial(
      analiseIaContratoSocial.camposExtraidos.capital_social,
    );
    const endereco = extrairEnderecoContratoSocial(
      analiseIaContratoSocial.camposExtraidos.endereco,
    );
    const situacaoCadastral = analiseIa.stage1?.situacaoCadastral ?? null;

    if (situacaoCadastral || capitalSocial !== null || endereco) {
      try {
        await this.dadosReceitaRepository.create({
          agenciaId: agencia.id,
          situacaoCadastral,
          dataAbertura: null,
          naturezaJuridica: null,
          porte: null,
          capitalSocial,
          telefone: null,
          email: null,
          optanteSimples: false,
          dataOpcaoSimples: null,
          endereco,
          cnaes: [],
        });
      } catch (error) {
        console.warn(`Falha ao persistir Dados da Receita (cnpj=${input.cnpj}): ${String(error)}`);
      }
    }

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
