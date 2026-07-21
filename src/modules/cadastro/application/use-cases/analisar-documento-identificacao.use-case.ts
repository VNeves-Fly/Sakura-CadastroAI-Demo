import type { UseCase } from "@/modules/shared/application/use-case";
import type { FileStorage } from "@/modules/cadastro/domain/services/file-storage";
import type { DocumentAnalysisService } from "@/modules/cadastro/domain/services/document-analysis-service";
import type {
  AnalisarDocumentoIdentificacaoInput,
  AnalisarDocumentoIdentificacaoOutput,
} from "@/modules/cadastro/application/dto/analisar-documento-identificacao.dto";

function extrairString(valor: unknown): string | null {
  return typeof valor === "string" && valor.length > 0 ? valor : null;
}

// A IA devolve a data em `DD/MM/YYYY` (às vezes já em ISO) — o wizard exige
// `YYYY-MM-DD` (mesmo formato de <input type="date">). Só devolve a data se
// ela for uma data de calendário real (rejeita "31/02/1990" em vez de deixar
// o JS normalizar pra "03/03/1990" silenciosamente).
function extrairDataNascimentoIso(valor: unknown): string | null {
  if (typeof valor !== "string") return null;

  const isoMatch = valor.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const brMatch = valor.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);

  const match = isoMatch ?? brMatch;
  if (!match) return null;

  const [ano, mes, dia] = isoMatch
    ? [match[1], match[2], match[3]]
    : [match[3], match[2], match[1]];
  if (!ano || !mes || !dia) return null;

  const iso = `${ano}-${mes}-${dia}`;
  const data = new Date(`${iso}T00:00:00`);
  const dataValida =
    !Number.isNaN(data.getTime()) &&
    data.getFullYear() === Number(ano) &&
    data.getMonth() + 1 === Number(mes) &&
    data.getDate() === Number(dia);

  return dataValida ? iso : null;
}

// Análise "preview" do RG/CNH de um sócio, disparada assim que o arquivo é
// anexado no Passo 5 — mesma ideia do AnalisarContratoSocialUseCase, mas
// pro documento de identificação: sobe o arquivo pra uma agência que ainda
// não existe e chama o mesmo DocumentAnalysisService que o
// FinalizarCadastroUseCase usa na análise final (o arquivo é re-enviado
// nesse momento; duplicação aceitável pelo ganho de UX de já preencher
// CPF/data de nascimento durante o preenchimento).
export class AnalisarDocumentoIdentificacaoUseCase implements UseCase<
  AnalisarDocumentoIdentificacaoInput,
  AnalisarDocumentoIdentificacaoOutput
> {
  constructor(
    private readonly fileStorage: FileStorage,
    private readonly documentAnalysisService: DocumentAnalysisService,
  ) {}

  async execute(
    input: AnalisarDocumentoIdentificacaoInput,
  ): Promise<AnalisarDocumentoIdentificacaoOutput> {
    const documentoSalvo = await this.fileStorage.save(
      input.documento,
      `agencias/${input.cnpj}/socio-${input.indice}-identificacao-preview`,
    );

    const resultado = await this.documentAnalysisService.analisar({
      cnpj: input.cnpj,
      documentPath: documentoSalvo.path,
      documentType: "doc_identificacao",
    });

    return {
      // A IA devolve o nome completo em `nome_completo`, não `nome`.
      nome: extrairString(resultado.camposExtraidos.nome_completo),
      cpf: extrairString(resultado.camposExtraidos.cpf),
      dataNascimento: extrairDataNascimentoIso(resultado.camposExtraidos.data_nascimento),
      // Especulativo — chaves `rg`/`rg_orgao_emissor`/`rg_uf` não confirmadas
      // em nenhuma documentação/teste/dado real de produção; degrada pra
      // null sem lançar erro se a IA não devolver ou vier em outro formato.
      rg: extrairString(resultado.camposExtraidos.rg),
      rgOrgaoEmissor: extrairString(resultado.camposExtraidos.rg_orgao_emissor),
      rgUf: extrairString(resultado.camposExtraidos.rg_uf),
      alertas: resultado.alertas,
      confianca: resultado.confiancaExtracao,
    };
  }
}
