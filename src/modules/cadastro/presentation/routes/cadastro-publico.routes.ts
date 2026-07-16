import { NextResponse } from "next/server";
import { httpCreated, httpError, httpOk } from "@/modules/shared/presentation/http-response";
import { ConflictError, DomainError, NotFoundError } from "@/modules/shared/domain/errors";
import { cadastroPublicoController } from "@/modules/cadastro/presentation/controllers/cadastro-publico.controller";
import { finalizarCadastroMetaSchema } from "@/modules/cadastro/application/dto/finalizar-cadastro.schema";
import type { UploadedFileInput } from "@/modules/cadastro/application/dto/finalizar-cadastro.dto";

function mapErrorToResponse(error: unknown) {
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
    const formData = await request.formData();

    const origemRaw = formData.get("origem");

    const parsedMeta = finalizarCadastroMetaSchema.safeParse({
      cnpj: formData.get("cnpj"),
      origem: typeof origemRaw === "string" && origemRaw.length > 0 ? origemRaw : undefined,
      telefoneComercial: formData.get("telefoneComercial") ?? "",
      emailOperacional: formData.get("emailOperacional") ?? "",
      emailComercial: formData.get("emailComercial") ?? "",
      emailFinanceiro: formData.get("emailFinanceiro") ?? "",
      socios: parseJsonField(formData.get("socios")) ?? [],
      enderecoBanco: parseJsonField(formData.get("enderecoBanco")),
    });

    if (!parsedMeta.success) {
      return NextResponse.json({ error: parsedMeta.error.flatten() }, { status: 422 });
    }

    const contratoSocialFile = formData.get("contratoSocial");

    if (!(contratoSocialFile instanceof File)) {
      return httpError("Contrato social é obrigatório.", 422);
    }

    const socios = await Promise.all(
      parsedMeta.data.socios.map(async (socioMetaItem, index) => {
        const rgFile = formData.get(`socio-${index}-rg`);

        if (!(rgFile instanceof File)) {
          throw new DomainError(`RG ou CNH do sócio ${index + 1} é obrigatório.`);
        }

        const procuracaoFile = formData.get(`socio-${index}-procuracao`);

        if (socioMetaItem.isRepresentante && !(procuracaoFile instanceof File)) {
          throw new DomainError(`Procuração do sócio ${index + 1} (representante) é obrigatória.`);
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
