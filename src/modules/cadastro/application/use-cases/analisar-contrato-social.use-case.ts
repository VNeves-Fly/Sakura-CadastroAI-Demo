import type { UseCase } from "@/modules/shared/application/use-case";
import type { FileStorage } from "@/modules/cadastro/domain/services/file-storage";
import type { DocumentAnalysisService } from "@/modules/cadastro/domain/services/document-analysis-service";
import { unmaskCnpj } from "@/modules/cadastro/utils/cnpj.util";
import type {
  AnalisarContratoSocialInput,
  AnalisarContratoSocialOutput,
} from "@/modules/cadastro/application/dto/analisar-contrato-social.dto";

function extrairString(valor: unknown): string | null {
  return typeof valor === "string" && valor.length > 0 ? valor : null;
}

function extrairListaStrings(valor: unknown): string[] {
  return Array.isArray(valor)
    ? valor.filter((item): item is string => typeof item === "string")
    : [];
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
    const documentPath = await this.fileStorage.save(
      input.contratoSocial,
      `agencias/${input.cnpj}/contrato-social-preview`,
    );

    const resultado = await this.documentAnalysisService.analisar({
      cnpj: input.cnpj,
      documentPath,
      documentType: "contrato_social",
    });

    const cnpjExtraido = extrairString(resultado.camposExtraidos.cnpj);

    return {
      cnpjConfere: cnpjExtraido ? unmaskCnpj(cnpjExtraido) === input.cnpj : null,
      nomesSocios: extrairListaStrings(resultado.camposExtraidos.socios_nomes_completos),
      alertas: resultado.alertas,
      confianca: resultado.confiancaExtracao,
    };
  }
}
