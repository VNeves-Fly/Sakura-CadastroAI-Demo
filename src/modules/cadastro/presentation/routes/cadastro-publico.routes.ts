import { NextResponse } from "next/server";
import { httpCreated, httpError, httpOk } from "@/modules/shared/presentation/http-response";
import { ConflictError, DomainError, NotFoundError } from "@/modules/shared/domain/errors";
import { cadastroPublicoController } from "@/modules/cadastro/presentation/controllers/cadastro-publico.controller";
import { preCadastrarAgenciaMetaSchema } from "@/modules/cadastro/application/dto/pre-cadastrar-agencia.schema";
import type { UploadedFileInput } from "@/modules/cadastro/application/dto/pre-cadastrar-agencia.dto";

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

export async function createAgenciaRoute(request: Request) {
  try {
    const formData = await request.formData();

    const socioMetaRaw = formData.get("socios");
    const socioMeta = typeof socioMetaRaw === "string" ? JSON.parse(socioMetaRaw) : [];
    const origemRaw = formData.get("origem");

    const parsedMeta = preCadastrarAgenciaMetaSchema.safeParse({
      cnpj: formData.get("cnpj"),
      origem: typeof origemRaw === "string" && origemRaw.length > 0 ? origemRaw : undefined,
      socios: socioMeta,
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

        return {
          nome: socioMetaItem.nome,
          email: socioMetaItem.email,
          telefone: socioMetaItem.telefone,
          rg: await toUploadedFile(rgFile),
        };
      }),
    );

    const agencia = await cadastroPublicoController.preCadastrarAgencia({
      cnpj: parsedMeta.data.cnpj,
      origem: parsedMeta.data.origem ?? null,
      contratoSocial: await toUploadedFile(contratoSocialFile),
      socios,
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
