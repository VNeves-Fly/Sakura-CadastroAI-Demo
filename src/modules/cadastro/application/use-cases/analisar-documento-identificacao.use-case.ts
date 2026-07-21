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
      nome: extrairString(resultado.camposExtraidos.nome),
      cpf: extrairString(resultado.camposExtraidos.cpf),
      dataNascimento: extrairString(resultado.camposExtraidos.data_nascimento),
      alertas: resultado.alertas,
      confianca: resultado.confiancaExtracao,
    };
  }
}
