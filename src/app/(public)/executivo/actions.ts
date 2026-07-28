"use server";

import { headers } from "next/headers";
import { atribuicoesPublicoController } from "@/modules/atribuicoes/presentation/controllers/atribuicoes-publico.controller";
import { solicitarLinkExecutivoSchema } from "@/modules/atribuicoes/application/dto/solicitar-link-executivo.schema";
import { obterUrlBase } from "@/modules/shared/utils/url-base.util";
import { verificarRateLimit } from "@/modules/shared/infrastructure/rate-limiter";
import { RateLimitError } from "@/modules/shared/domain/errors";

// Poucas tentativas por IP bastam num fluxo legítimo (o executivo pede o
// link uma vez, no máximo reenvia depois de errar o e-mail) — mesmo
// espírito de RATE_LIMIT_RECUPERAR_SENHA em users.routes.ts.
const RATE_LIMIT_SOLICITAR_LINK = { limite: 5, janelaMs: 15 * 60 * 1000 };

// Server Actions não recebem um Request — lê os mesmos headers via
// next/headers() em vez de duplicar obterIpCliente pra dois formatos de
// entrada (mesmo padrão de documentos-pendentes/actions.ts).
function ipCliente(): string {
  const cabecalhos = headers();
  const forwardedFor = cabecalhos.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0]?.trim() ?? "desconhecido";
  return cabecalhos.get("x-real-ip") ?? "desconhecido";
}

export async function solicitarLinkExecutivoAction(
  email: string,
): Promise<{ encontrado: boolean }> {
  if (!verificarRateLimit(`executivo-acesso:${ipCliente()}`, RATE_LIMIT_SOLICITAR_LINK)) {
    throw new RateLimitError();
  }

  const parsed = solicitarLinkExecutivoSchema.safeParse({ email });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "E-mail inválido.");
  }

  return atribuicoesPublicoController.solicitarLinkExecutivo({
    email: parsed.data.email,
    baseUrl: obterUrlBase(headers()),
  });
}
