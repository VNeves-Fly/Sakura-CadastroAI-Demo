"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { cadastroPublicoController } from "@/modules/cadastro/presentation/controllers/cadastro-publico.controller";
import { validarArquivoUpload } from "@/modules/cadastro/utils/arquivo-upload.util";
import { verificarRateLimit } from "@/modules/shared/infrastructure/rate-limiter";
import { RateLimitError } from "@/modules/shared/domain/errors";

// Página sem login (o id da agência é o "token") — sem rate limit,
// qualquer um com o link poderia forçar uploads em loop. Mesmo limite
// generoso das outras rotas públicas de escrita do cadastro.
const RATE_LIMIT_REENVIO = { limite: 10, janelaMs: 10 * 60 * 1000 };

// Server Actions não recebem um Request — sem isso, obterIpCliente (que
// espera request.headers) não serve aqui; lê os mesmos headers via
// next/headers() em vez de duplicar a assinatura da função pra dois
// formatos de entrada.
function ipCliente(): string {
  const cabecalhos = headers();
  const forwardedFor = cabecalhos.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0]?.trim() ?? "desconhecido";
  return cabecalhos.get("x-real-ip") ?? "desconhecido";
}

export async function reenviarDocumentoAction(
  agenciaId: string,
  documentoId: string,
  formData: FormData,
) {
  if (!verificarRateLimit(`documentos-pendentes:${ipCliente()}`, RATE_LIMIT_REENVIO)) {
    throw new RateLimitError();
  }

  const arquivo = formData.get("arquivo");

  if (!(arquivo instanceof File)) {
    throw new Error("Selecione um arquivo.");
  }

  const erro = validarArquivoUpload(arquivo, "Documento");
  if (erro) {
    throw new Error(erro);
  }

  const buffer = Buffer.from(await arquivo.arrayBuffer());

  await cadastroPublicoController.reenviarDocumento({
    agenciaId,
    documentoId,
    arquivo: { buffer, originalName: arquivo.name, mimeType: arquivo.type },
  });

  revalidatePath(`/cadastro/documentos-pendentes/${agenciaId}`);
}
