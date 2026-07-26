import type { UseCase } from "@/modules/shared/application/use-case";
import { ConflictError } from "@/modules/shared/domain/errors";
import {
  STATUS_EM_ANALISE,
  type AgenciaRepository,
} from "@/modules/cadastro/domain/repositories/agencia-repository";
import type { ExecutivoResolver } from "@/modules/cadastro/domain/repositories/executivo-resolver";
import type { FileStorage } from "@/modules/cadastro/domain/services/file-storage";
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

// Só persiste o que o wizard coletou (arquivos + dados do formulário),
// com status inicial "em_analise" — a análise de IA (documentos +
// avaliação final) e a geração do contrato rodam depois, de forma
// assíncrona (ver AnalisarCadastroUseCase, disparado pela rota logo após
// este use-case retornar). Isso garante que o cadastro nunca se perde:
// mesmo que a IA ou o D4Sign falhem, a Agência já está no banco.
export class FinalizarCadastroUseCase implements UseCase<
  FinalizarCadastroInput,
  FinalizarCadastroOutput
> {
  constructor(
    private readonly agenciaRepository: AgenciaRepository,
    private readonly fileStorage: FileStorage,
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
          rgNumero: socio.rgNumero,
          rgOrgaoEmissor: socio.rgOrgaoEmissor,
          nacionalidade: socio.nacionalidade,
          administrativo: socio.administrativo,
          endereco: socio.endereco,
          isRepresentante: socio.isRepresentante,
          rgPath: rgSalvo.path,
          rgBucket: rgSalvo.bucket,
          procuracaoPath: procuracaoSalva?.path ?? null,
          procuracaoBucket: procuracaoSalva?.bucket ?? null,
        };
      }),
    );

    // Quando o endereço da agência é "o mesmo do sócio", o formulário não
    // manda um endereço próprio (`enderecoBanco.endereco` vem null) — copia
    // do sócio vinculado, já que agora existe uma linha real de endereço
    // por sócio pra copiar (antes ficava null dentro do JSON).
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

    const agencia = await this.agenciaRepository.create({
      razaoSocial,
      cnpj: input.cnpj,
      status: STATUS_EM_ANALISE,
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
      socios: socios.map((socio) => ({
        nome: socio.nome,
        cpf: socio.cpf,
        email: socio.email,
        telefone: socio.telefone,
        dataNascimento: new Date(`${socio.dataNascimento}T00:00:00`),
        estadoCivil: socio.estadoCivil,
        rgNumero: socio.rgNumero,
        rgOrgaoEmissor: socio.rgOrgaoEmissor,
        nacionalidade: socio.nacionalidade,
        administrativo: socio.administrativo,
        endereco: socio.endereco,
        isRepresentanteLegal: socio.isRepresentante,
        rgPath: socio.rgPath,
        rgBucket: socio.rgBucket,
        procuracaoPath: socio.procuracaoPath,
        procuracaoBucket: socio.procuracaoBucket,
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
    });

    return {
      id: agencia.id,
      cnpj: agencia.cnpj,
      razaoSocial: agencia.razaoSocial,
      status: agencia.status,
    };
  }
}
