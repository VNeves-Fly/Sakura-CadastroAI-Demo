import type { UseCase } from "@/modules/shared/application/use-case";
import { ConflictError, NotFoundError } from "@/modules/shared/domain/errors";
import {
  CONTRATO_PROVEDOR_ID_PENDENTE,
  CONTRATO_STATUS_AGUARDANDO_ASSINATURA,
  STATUS_AGUARDANDO_ASSINATURA,
  STATUS_EM_COMPLEMENTAR,
  type AgenciaRepository,
} from "@/modules/cadastro/domain/repositories/agencia-repository";
import type { ContratoAssinaturaService } from "@/modules/cadastro/domain/services/contrato-assinatura-service";
import type { Agencia } from "@/modules/cadastro/domain/entities/agencia.entity";
import type { Documento } from "@/modules/cadastro/domain/entities/documento.entity";
import type { DecisaoHumanaRepository } from "@/modules/cadastro/domain/repositories/decisao-humana-repository";
import type { ContratoAssinaturaRepository } from "@/modules/cadastro/domain/repositories/contrato-assinatura-repository";
import { persistirKeySigners } from "@/modules/cadastro/domain/services/assinatura-socios.util";
import { iniciarVerificacoesBiometricas } from "@/modules/cadastro/application/use-cases/iniciar-verificacoes-biometricas.util";
import type { IniciarVerificacaoBiometricaUseCase } from "@/modules/cadastro/application/use-cases/iniciar-verificacao-biometrica.use-case";
import { notificarAssinaturaSemBiometria } from "@/modules/cadastro/application/use-cases/notificar-assinatura-sem-biometria.util";
import type { EmailSender } from "@/modules/shared/domain/services/email-sender";

export interface AprovarCadastroComplementarInput {
  id: string;
  analistaEmail: string;
  // Base da URL pública (obterUrlBase(headers())) — usada só quando a
  // agência tem gateBiometriaAtivo, pro link de biometria mandado ao sócio.
  baseUrl: string;
  // Checkbox "gerar contrato automaticamente" no modal de confirmação —
  // default true (comportamento de sempre). Quando false, pula a geração
  // no D4Sign e cria um Contrato-placeholder (ver
  // CONTRATO_PROVEDOR_ID_PENDENTE) pro analista anexar um documento já
  // existente depois via "Contrato assinado por fora da plataforma"
  // (RegistrarContratoExternoUseCase) — útil por exemplo pra recuperar um
  // documento órfão no D4Sign sem duplicar a geração.
  gerarContratoAutomaticamente?: boolean;
}

// Só entram aqui documentos que EXISTEM (slot != null) — sócio sem RG
// enviado ainda é um problema de completude, não desta regra (ver
// discussão do usuário, 2026-07-27): a trava é "o que foi enviado tem
// que estar aprovado", não "tudo tem que ter sido enviado".
function documentosNaoAprovados(
  contratoSocial: Documento | null,
  representantesLegais: Array<{ nome: string; rg: Documento | null; procuracao: Documento | null }>,
): Array<{ label: string; documento: Documento }> {
  const candidatos: Array<{ label: string; documento: Documento | null }> = [
    { label: "Contrato Social", documento: contratoSocial },
    ...representantesLegais.flatMap((socio) => [
      { label: `RG/CNH — ${socio.nome}`, documento: socio.rg },
      { label: `Procuração — ${socio.nome}`, documento: socio.procuracao },
    ]),
  ];

  return candidatos
    .filter(
      (candidato): candidato is { label: string; documento: Documento } =>
        candidato.documento !== null && candidato.documento.status !== "APROVADO",
    )
    .map((candidato) => ({ label: candidato.label, documento: candidato.documento }));
}

// Ação do analista: um caso que a IA mandou pra fila "em_complementar"
// (algo pareceu errado) foi revisado manualmente e está tudo certo —
// aprova na mão e move pra fila "aguardando_assinatura". Por padrão gera e
// envia o contrato (mesma integração D4Sign do fluxo automático); com
// `gerarContratoAutomaticamente: false` (checkbox no modal de confirmação)
// pula isso e cria um Contrato-placeholder pro analista anexar um
// documento já existente depois.
export class AprovarCadastroComplementarUseCase implements UseCase<
  AprovarCadastroComplementarInput,
  Agencia
> {
  constructor(
    private readonly agenciaRepository: AgenciaRepository,
    private readonly contratoAssinaturaService: ContratoAssinaturaService,
    private readonly decisaoHumanaRepository: DecisaoHumanaRepository,
    private readonly contratoAssinaturaRepository: ContratoAssinaturaRepository,
    private readonly iniciarVerificacaoBiometricaUseCase: IniciarVerificacaoBiometricaUseCase,
    private readonly emailSender: EmailSender,
  ) {}

  async execute({
    id,
    analistaEmail,
    baseUrl,
    gerarContratoAutomaticamente = true,
  }: AprovarCadastroComplementarInput): Promise<Agencia> {
    const detalhe = await this.agenciaRepository.obterDetalhe(id);

    if (!detalhe) {
      throw new NotFoundError("Agência");
    }

    if (detalhe.agencia.status !== STATUS_EM_COMPLEMENTAR) {
      throw new ConflictError("Este cadastro não está na fila de complementar.");
    }

    const pendentes = documentosNaoAprovados(detalhe.contratoSocial, detalhe.representantesLegais);
    if (pendentes.length > 0) {
      throw new ConflictError(
        `Existem documentos ainda não aprovados: ${pendentes.map((p) => p.label).join(", ")}.`,
      );
    }

    // `administrativo === false` é a única marca que exclui um sócio da
    // lista de signatarios — null (IA não avaliou) e true assinam (ver
    // RepresentanteLegal.administrativo no schema).
    const signatarios = detalhe.representantesLegais
      .filter((socio) => socio.administrativo !== false)
      .map((socio) => ({
        nome: socio.nome,
        email: socio.email,
        cpf: socio.cpf,
        rgNumero: socio.rgNumero,
        rgOrgaoEmissor: socio.rgOrgaoEmissor,
        nacionalidade: socio.nacionalidade,
        estadoCivil: socio.estadoCivil,
        dataNascimento: socio.dataNascimento,
        endereco: socio.endereco,
      }));

    let agencia: Agencia;

    if (gerarContratoAutomaticamente) {
      const contratoResult = await this.contratoAssinaturaService.gerarEEnviar({
        cnpj: detalhe.agencia.cnpj,
        razaoSocial: detalhe.agencia.razaoSocial,
        endereco: detalhe.complementar?.enderecoAgencia ?? {
          cep: "",
          logradouro: "",
          numero: "",
          complemento: "",
          bairro: "",
          cidade: "",
          uf: "",
        },
        signatarios,
        gateBiometriaAtivo: detalhe.agencia.gateBiometriaAtivo,
      });

      // Contrato + avanço de status numa transação só (ver
      // criarContratoEAvancarStatus) — antes eram duas escritas separadas
      // e uma falha entre elas deixava o Contrato criado com a Agencia
      // travada em em_complementar (incidente real, 2026-08-19).
      const resultado = await this.agenciaRepository.criarContratoEAvancarStatus(
        id,
        {
          provedorId: contratoResult.provedorId,
          status: contratoResult.status,
          origemGeracao: "humano",
          signatarios,
        },
        STATUS_AGUARDANDO_ASSINATURA,
        { usuarioEmail: analistaEmail, origem: "usuario" },
      );
      agencia = resultado.agencia;
      await persistirKeySigners(
        this.contratoAssinaturaRepository,
        resultado.contratoId,
        contratoResult.signatariosKeySigner,
      );
      if (detalhe.agencia.gateBiometriaAtivo) {
        await iniciarVerificacoesBiometricas(
          this.iniciarVerificacaoBiometricaUseCase,
          resultado.contratoId,
          id,
          signatarios,
          baseUrl,
        );
      } else {
        await notificarAssinaturaSemBiometria(this.emailSender, signatarios, baseUrl);
      }
    } else {
      const resultado = await this.agenciaRepository.criarContratoEAvancarStatus(
        id,
        {
          provedorId: CONTRATO_PROVEDOR_ID_PENDENTE,
          status: CONTRATO_STATUS_AGUARDANDO_ASSINATURA,
          origemGeracao: "externo",
          signatarios,
        },
        STATUS_AGUARDANDO_ASSINATURA,
        { usuarioEmail: analistaEmail, origem: "usuario" },
      );
      agencia = resultado.agencia;
    }

    // Auditoria de quem aprovou manualmente — best-effort: a agência já
    // avançou pro contrato, então uma falha aqui nunca deve reverter o
    // fluxo, só fica sem esse registro (ver mesmo padrão em
    // AnalisarCadastroUseCase pra DadosReceita).
    try {
      await this.decisaoHumanaRepository.create({
        agenciaId: id,
        etapa: "COMPLEMENTAR",
        decisaoHumana: "APROVADO",
        decisaoIa: detalhe.analiseIa?.parecer ?? detalhe.analiseIa?.resultado ?? null,
        divergiu: detalhe.analiseIa?.resultado === "REPROVADO",
        usuarioEmail: analistaEmail,
      });
    } catch (error) {
      console.warn(`Falha ao registrar DecisaoHumana (agenciaId=${id}): ${String(error)}`);
    }

    return agencia;
  }
}
