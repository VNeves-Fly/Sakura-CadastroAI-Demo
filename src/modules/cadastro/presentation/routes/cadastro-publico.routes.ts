import { httpCreated, httpError, httpOk } from "@/modules/shared/presentation/http-response";
import {
  ConflictError,
  DomainError,
  NotFoundError,
  RateLimitError,
} from "@/modules/shared/domain/errors";
import { obterIpCliente, verificarRateLimit } from "@/modules/shared/infrastructure/rate-limiter";
import { cadastroPublicoController } from "@/modules/cadastro/presentation/controllers/cadastro-publico.controller";
import { finalizarCadastroMetaSchema } from "@/modules/cadastro/application/dto/finalizar-cadastro.schema";
import { validarArquivoUpload } from "@/modules/cadastro/utils/arquivo-upload.util";
import type { UploadedFileInput } from "@/modules/cadastro/application/dto/finalizar-cadastro.dto";

// Envio do cadastro: poucas tentativas por IP bastam num fluxo legítimo
// (o usuário preenche uma vez só); limite generoso o bastante pra reenvio
// depois de corrigir um erro de validação.
const RATE_LIMIT_SUBMIT = { limite: 5, janelaMs: 10 * 60 * 1000 };
// Consulta QSA dispara a cada CNPJ completo digitado — mais frequente,
// limite mais folgado.
const RATE_LIMIT_QSA = { limite: 30, janelaMs: 60 * 1000 };
// Análise de documento chama o agents-service (Document AI) — mais custosa
// que a QSA, dispara só quando CNPJ+arquivo estão prontos.
const RATE_LIMIT_ANALISE_DOCUMENTO = { limite: 10, janelaMs: 5 * 60 * 1000 };

function mapErrorToResponse(error: unknown) {
  if (error instanceof RateLimitError) {
    return httpError(error.message, 429);
  }
  if (error instanceof NotFoundError) {
    return httpError(error.message, 404);
  }
  if (error instanceof ConflictError) {
    return httpError(error.message, 409);
  }
  if (error instanceof DomainError) {
    return httpError(error.message, 400);
  }
  return httpError("Erro interno do servidor.", 500);
}

async function toUploadedFile(file: File): Promise<UploadedFileInput> {
  const buffer = Buffer.from(await file.arrayBuffer());
  return { buffer, originalName: file.name, mimeType: file.type };
}

function parseJsonField(value: FormDataEntryValue | null): unknown {
  return typeof value === "string" ? JSON.parse(value) : undefined;
}

export async function createAgenciaRoute(request: Request) {
  try {
    const chaveRateLimit = `cadastro-agencia:${obterIpCliente(request)}`;
    if (!verificarRateLimit(chaveRateLimit, RATE_LIMIT_SUBMIT)) {
      throw new RateLimitError();
    }

    const formData = await request.formData();

    const origemRaw = formData.get("origem");

    const parsedMeta = finalizarCadastroMetaSchema.safeParse({
      cnpj: formData.get("cnpj"),
      origem: typeof origemRaw === "string" && origemRaw.length > 0 ? origemRaw : undefined,
      telefoneComercial: formData.get("telefoneComercial") ?? "",
      semTelefoneComercial: formData.get("semTelefoneComercial") === "true",
      emailOperacional: formData.get("emailOperacional") ?? "",
      emailComercial: formData.get("emailComercial") ?? "",
      emailFinanceiro: formData.get("emailFinanceiro") ?? "",
      socios: parseJsonField(formData.get("socios")) ?? [],
      enderecoBanco: parseJsonField(formData.get("enderecoBanco")),
    });

    if (!parsedMeta.success) {
      const mensagens = [...new Set(parsedMeta.error.issues.map((issue) => issue.message))];
      return httpError(mensagens.join(" ") || "Dados inválidos.", 422);
    }

    const contratoSocialFile = formData.get("contratoSocial");

    if (!(contratoSocialFile instanceof File)) {
      return httpError("Contrato social é obrigatório.", 422);
    }

    const erroContratoSocial = validarArquivoUpload(contratoSocialFile, "Contrato Social");
    if (erroContratoSocial) {
      return httpError(erroContratoSocial, 422);
    }

    const socios = await Promise.all(
      parsedMeta.data.socios.map(async (socioMetaItem, index) => {
        const rgFile = formData.get(`socio-${index}-rg`);

        if (!(rgFile instanceof File)) {
          throw new DomainError(`RG ou CNH do sócio ${index + 1} é obrigatório.`);
        }

        const erroRg = validarArquivoUpload(rgFile, `RG ou CNH do sócio ${index + 1}`);
        if (erroRg) {
          throw new DomainError(erroRg);
        }

        const procuracaoFile = formData.get(`socio-${index}-procuracao`);

        if (socioMetaItem.isRepresentante && !(procuracaoFile instanceof File)) {
          throw new DomainError(`Procuração do sócio ${index + 1} (representante) é obrigatória.`);
        }

        if (procuracaoFile instanceof File) {
          const erroProcuracao = validarArquivoUpload(
            procuracaoFile,
            `Procuração do sócio ${index + 1}`,
          );
          if (erroProcuracao) {
            throw new DomainError(erroProcuracao);
          }
        }

        return {
          nome: socioMetaItem.nome,
          cpf: socioMetaItem.cpf,
          email: socioMetaItem.email,
          telefone: socioMetaItem.telefone,
          estadoCivil: socioMetaItem.estadoCivil,
          endereco: socioMetaItem.endereco,
          isRepresentante: socioMetaItem.isRepresentante,
          rg: await toUploadedFile(rgFile),
          procuracao: procuracaoFile instanceof File ? await toUploadedFile(procuracaoFile) : null,
        };
      }),
    );

    const agencia = await cadastroPublicoController.finalizarCadastro({
      cnpj: parsedMeta.data.cnpj,
      origem: parsedMeta.data.origem ?? null,
      contratoSocial: await toUploadedFile(contratoSocialFile),
      telefoneComercial: parsedMeta.data.telefoneComercial,
      emailOperacional: parsedMeta.data.emailOperacional,
      emailComercial: parsedMeta.data.emailComercial,
      emailFinanceiro: parsedMeta.data.emailFinanceiro,
      socios,
      enderecoBanco: parsedMeta.data.enderecoBanco,
    });

    return httpCreated(agencia);
  } catch (error) {
    return mapErrorToResponse(error);
  }
}

export async function consultarQsaRoute(request: Request) {
  try {
    const chaveRateLimit = `cadastro-qsa:${obterIpCliente(request)}`;
    if (!verificarRateLimit(chaveRateLimit, RATE_LIMIT_QSA)) {
      throw new RateLimitError();
    }

    const body = await request.json();
    const cnpj = typeof body?.cnpj === "string" ? body.cnpj : "";

    if (!cnpj) {
      return httpError("CNPJ é obrigatório.", 422);
    }

    const resultado = await cadastroPublicoController.consultarQsa(cnpj);
    return httpOk(resultado);
  } catch (error) {
    return mapErrorToResponse(error);
  }
}

export async function analisarContratoSocialRoute(request: Request) {
  try {
    const chaveRateLimit = `cadastro-analise-documento:${obterIpCliente(request)}`;
    if (!verificarRateLimit(chaveRateLimit, RATE_LIMIT_ANALISE_DOCUMENTO)) {
      throw new RateLimitError();
    }

    const formData = await request.formData();
    const cnpj = formData.get("cnpj");
    const contratoSocialFile = formData.get("contratoSocial");

    if (typeof cnpj !== "string" || !cnpj) {
      return httpError("CNPJ é obrigatório.", 422);
    }
    if (!(contratoSocialFile instanceof File)) {
      return httpError("Contrato social é obrigatório.", 422);
    }

    const erroArquivo = validarArquivoUpload(contratoSocialFile, "Contrato Social");
    if (erroArquivo) {
      return httpError(erroArquivo, 422);
    }

    const resultado = await cadastroPublicoController.analisarContratoSocial({
      cnpj,
      contratoSocial: await toUploadedFile(contratoSocialFile),
    });

    return httpOk(resultado);
  } catch (error) {
    return mapErrorToResponse(error);
  }
}
