import type { UseCase } from "@/modules/shared/application/use-case";
import type { FileStorage } from "@/modules/cadastro/domain/services/file-storage";
import type { DocumentAnalysisService } from "@/modules/cadastro/domain/services/document-analysis-service";
import { unmaskCnpj } from "@/modules/cadastro/utils/cnpj.util";
import type {
  AnalisarContratoSocialInput,
  AnalisarContratoSocialOutput,
  EnderecoSocioContratoSocial,
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

function extrairEnderecoSocio(valor: unknown): EnderecoSocioContratoSocial | null {
  if (typeof valor !== "object" || valor === null) return null;
  const registro = valor as Record<string, unknown>;

  const endereco: EnderecoSocioContratoSocial = {
    logradouro: extrairString(registro.logradouro),
    numero: extrairString(registro.numero),
    bairro: extrairString(registro.bairro),
    cidade: extrairString(registro.cidade),
    uf: extrairString(registro.uf),
    cep: extrairString(registro.cep),
  };

  const temAlgumCampo = Object.values(endereco).some((campo) => campo !== null);
  return temAlgumCampo ? endereco : null;
}

// Especulativo — tenta o shape rico (`socios: [{nome, endereco}]`), que
// nunca foi confirmado em documentação/teste/dado real de produção. Se a
// IA não devolver isso (ou vier em outro formato), degrada com segurança
// pro shape hoje confirmado (`socios_nomes_completos: string[]`, só
// nomes, sem endereço) — nunca lança erro.
function extrairSocios(camposExtraidos: Record<string, unknown>): SocioContratoSocialExtraido[] {
  const socioLista = camposExtraidos.socios;

  if (Array.isArray(socioLista) && socioLista.length > 0) {
    const socios = socioLista
      .map((item): SocioContratoSocialExtraido | null => {
        if (typeof item !== "object" || item === null) return null;
        const registro = item as Record<string, unknown>;
        const nome = extrairString(registro.nome);
        if (!nome) return null;
        return { nome, endereco: extrairEnderecoSocio(registro.endereco) };
      })
      .filter((item): item is SocioContratoSocialExtraido => item !== null);

    if (socios.length > 0) return socios;
  }

  return extrairListaStrings(camposExtraidos.socios_nomes_completos).map((nome) => ({
    nome,
    endereco: null,
  }));
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
      capitalSocial: extrairString(resultado.camposExtraidos.capital_social),
      enderecoEmpresa: extrairString(resultado.camposExtraidos.endereco_completo),
      objetoSocial: extrairString(resultado.camposExtraidos.objeto_social),
      dataConstituicao: extrairString(resultado.camposExtraidos.data_constituicao),
    };
  }
}
