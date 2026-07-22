import type { UseCase } from "@/modules/shared/application/use-case";
import type { FileStorage } from "@/modules/cadastro/domain/services/file-storage";
import type { DocumentAnalysisService } from "@/modules/cadastro/domain/services/document-analysis-service";
import { unmaskCnpj } from "@/modules/cadastro/utils/cnpj.util";
import type {
  AnalisarContratoSocialInput,
  AnalisarContratoSocialOutput,
  EnderecoEmpresaContratoSocial,
  SocioContratoSocialExtraido,
} from "@/modules/cadastro/application/dto/analisar-contrato-social.dto";

function extrairString(valor: unknown): string | null {
  return typeof valor === "string" && valor.length > 0 ? valor : null;
}

function extrairListaStrings(valor: unknown): string[] {
  return Array.isArray(valor)
    ? valor.filter((item): item is string => typeof item === "string")
    : [];
}

// Mesma normalização usada em receitaws-qsa-consulta.adapter.ts pro capital
// social vindo da Receita — aceita tanto número quanto string em formato BR
// ("100.000,00").
function extrairCapitalSocial(valor: unknown): number | null {
  if (typeof valor === "number" && Number.isFinite(valor)) return valor;
  if (typeof valor !== "string") return null;

  const normalizado = valor.replace(/\./g, "").replace(",", ".");
  const numero = Number(normalizado);
  return Number.isFinite(numero) ? numero : null;
}

// `endereco` é um objeto confirmado no schema do agente (document_type.py,
// AgentsService) — cep/logradouro/numero/complemento/bairro/municipio/uf.
function extrairEnderecoEmpresa(valor: unknown): EnderecoEmpresaContratoSocial | null {
  if (typeof valor !== "object" || valor === null) return null;
  const registro = valor as Record<string, unknown>;

  const endereco: EnderecoEmpresaContratoSocial = {
    cep: extrairString(registro.cep),
    logradouro: extrairString(registro.logradouro),
    numero: extrairString(registro.numero),
    complemento: extrairString(registro.complemento),
    bairro: extrairString(registro.bairro),
    municipio: extrairString(registro.municipio),
    uf: extrairString(registro.uf),
  };

  const temAlgumCampo = Object.values(endereco).some((campo) => campo !== null);
  return temAlgumCampo ? endereco : null;
}

// Contrato social só devolve `socios_nomes_completos` (lista de nomes) —
// não há endereço por sócio no schema do agente.
function extrairSocios(camposExtraidos: Record<string, unknown>): SocioContratoSocialExtraido[] {
  return extrairListaStrings(camposExtraidos.socios_nomes_completos).map((nome) => ({ nome }));
}

// Análise "preview" no Passo 1 do wizard, antes do cadastro existir de
// verdade — sobe o contrato social pra uma agência que ainda não foi
// criada e chama o mesmo DocumentAnalysisService que o FinalizarCadastroUseCase
// usa depois (na análise final, o arquivo é re-enviado; essa duplicação é
// aceitável pelo ganho de UX de avisar o usuário cedo).
export class AnalisarContratoSocialUseCase implements UseCase<
  AnalisarContratoSocialInput,
  AnalisarContratoSocialOutput
> {
  constructor(
    private readonly fileStorage: FileStorage,
    private readonly documentAnalysisService: DocumentAnalysisService,
  ) {}

  async execute(input: AnalisarContratoSocialInput): Promise<AnalisarContratoSocialOutput> {
    const contratoSocialSalvo = await this.fileStorage.save(
      input.contratoSocial,
      `agencias/${input.cnpj}/contrato-social-preview`,
    );

    const resultado = await this.documentAnalysisService.analisar({
      cnpj: input.cnpj,
      documentPath: contratoSocialSalvo.path,
      documentType: "contrato_social",
    });

    const cnpjExtraido = extrairString(resultado.camposExtraidos.cnpj);

    return {
      cnpjConfere: cnpjExtraido ? unmaskCnpj(cnpjExtraido) === input.cnpj : null,
      socios: extrairSocios(resultado.camposExtraidos),
      alertas: resultado.alertas,
      confianca: resultado.confiancaExtracao,
      resumoAnalise: resultado.resumoAnalise,
      camposObrigatoriosPresentes: resultado.checagens?.camposObrigatoriosPresentes ?? null,
      camposExtras: resultado.camposExtras,
      razaoSocialExtraida: extrairString(resultado.camposExtraidos.razao_social),
      capitalSocial: extrairCapitalSocial(resultado.camposExtraidos.capital_social),
      enderecoEmpresa: extrairEnderecoEmpresa(resultado.camposExtraidos.endereco),
      objetoSocial: extrairString(resultado.camposExtraidos.objeto_social),
      dataConstituicao: extrairString(resultado.camposExtraidos.data_constituicao),
    };
  }
}
