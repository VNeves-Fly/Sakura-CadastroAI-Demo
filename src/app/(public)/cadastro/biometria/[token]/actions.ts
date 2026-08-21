"use server";

import { headers } from "next/headers";
import { cadastroPublicoController } from "@/modules/cadastro/presentation/controllers/cadastro-publico.controller";
import { verificarRateLimit } from "@/modules/shared/infrastructure/rate-limiter";
import { RateLimitError } from "@/modules/shared/domain/errors";
import type { ObterStatusBiometriaResult } from "@/modules/cadastro/application/use-cases/obter-status-biometria.use-case";
import { unmaskCpf } from "@/modules/cadastro/utils/cpf.util";

// Página sem login (token opaco na URL + confirmação de CPF) — protege
// contra tentativa de adivinhar o CPF de quem recebeu um token de verdade
// (e vice-versa). Mesmo espírito do rate limit de documentos-pendentes.
const RATE_LIMIT_CONFIRMAR_BIOMETRIA = { limite: 10, janelaMs: 10 * 60 * 1000 };

// Server Actions não recebem um Request — lê os mesmos headers via
// next/headers() (mesmo padrão de documentos-pendentes/actions.ts).
function ipCliente(): string {
  const cabecalhos = headers();
  const forwardedFor = cabecalhos.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0]?.trim() ?? "desconhecido";
  return cabecalhos.get("x-real-ip") ?? "desconhecido";
}

export async function confirmarBiometriaAction(
  token: string,
  cpfMascarado: string,
): Promise<ObterStatusBiometriaResult> {
  if (!verificarRateLimit(`biometria:${ipCliente()}`, RATE_LIMIT_CONFIRMAR_BIOMETRIA)) {
    throw new RateLimitError();
  }

  return cadastroPublicoController.obterStatusBiometria({
    token,
    cpf: unmaskCpf(cpfMascarado),
  });
}
