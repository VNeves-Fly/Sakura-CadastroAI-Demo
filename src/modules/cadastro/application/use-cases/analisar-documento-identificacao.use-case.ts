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

// Shape confirmado do agente (document_type.py, AgentsService): `rg` é um
// objeto `{value, expedidor, expedidor_uf}` — não 3 chaves soltas no nível
// raiz. Só existe quando o documento é uma CNH que referencia o RG do
// titular (ou outro doc_identificacao classificado como CNH); quando o
// próprio documento classifica como RG, essa info está em
// numero_documento/orgao_emissor (ver extrairDadosRg).
interface RgExtraido {
  value: string | null;
  expedidor: string | null;
  expedidorUf: string | null;
}

function extrairRgObjeto(valor: unknown): RgExtraido | null {
  if (typeof valor !== "object" || valor === null) return null;
  const registro = valor as Record<string, unknown>;

  const rg: RgExtraido = {
    value: extrairString(registro.value),
    expedidor: extrairString(registro.expedidor),
    expedidorUf: extrairString(registro.expedidor_uf),
  };

  return rg.value || rg.expedidor || rg.expedidorUf ? rg : null;
}

// Quando o documento classifica como RG (não CNH), o próprio documento É o
// RG — a IA preenche os campos de topo numero_documento/orgao_emissor (não
// o objeto `rg`, que é só pra CNH referenciando um RG externo). Cai pra
// esse fallback só nesse caso.
function extrairDadosRg(camposExtraidos: Record<string, unknown>): RgExtraido | null {
  const doObjeto = extrairRgObjeto(camposExtraidos.rg);
  if (doObjeto) return doObjeto;

  const tipo = extrairString(camposExtraidos.tipo_documento_identificado);
  if (tipo !== "RG") return null;

  const value = extrairString(camposExtraidos.numero_documento);
  const expedidor = extrairString(camposExtraidos.orgao_emissor);
  return value || expedidor ? { value, expedidor, expedidorUf: null } : null;
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

    const rg = extrairDadosRg(resultado.camposExtraidos);

    return {
      // A IA devolve o nome completo em `nome_completo`, não `nome`.
      nome: extrairString(resultado.camposExtraidos.nome_completo),
      cpf: extrairString(resultado.camposExtraidos.cpf),
      dataNascimento: extrairDataNascimentoIso(resultado.camposExtraidos.data_nascimento),
      rg: rg?.value ?? null,
      rgOrgaoEmissor: rg?.expedidor ?? null,
      rgUf: rg?.expedidorUf ?? null,
      alertas: resultado.alertas,
      confianca: resultado.confiancaExtracao,
    };
  }
}
