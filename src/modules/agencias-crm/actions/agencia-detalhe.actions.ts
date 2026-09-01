"use server";

import { getServerSession } from "next-auth";
import { nextAuthOptions } from "@/modules/auth/presentation/routes/next-auth.options";
import { hashParaNumero } from "@/modules/shared/utils/hash-deterministico.util";
import type { VolumeCanalPeriodoAgencia } from "@/modules/agencias-crm/types/agencia-detalhe.types";

// Mesmo guard de /crm/agencias/[id]/page.tsx — Server Actions são
// endpoints próprios (POST), não herdam o redirect da página.
const CARGOS_COM_ACESSO = new Set(["ADMIN", "DIRETOR_ANALISTA"]);
const FORMATO_DATA_ISO = /^\d{4}-\d{2}-\d{2}$/;

async function garantirAcesso(): Promise<void> {
  const session = await getServerSession(nextAuthOptions);
  if (!session || !CARGOS_COM_ACESSO.has(session.user.cargo)) {
    throw new Error("Acesso não permitido.");
  }
}

// Chamada pelo popover de período do card "Volume total" (aba Dashboard
// do detalhe de Agência) quando o usuário aplica um intervalo
// personalizado — repositório de DEMONSTRAÇÃO: nunca chama o SST. Gera um
// volume mock determinístico pro intervalo pedido, com seed = hash do
// `codigoEmpresa` (= id/sica da agência mock) combinado ao hash das datas
// escolhidas, de forma que o mesmo intervalo sempre produz o mesmo
// resultado pra mesma agência (mesmo padrão de `gerarVolumePorPeriodo`,
// que já mocka dia/ontem/mês/ano a partir do volume anual). O total do
// intervalo é proporcional ao número de dias pedido, escalado sobre o
// volume "mês" mock dessa agência.
export async function obterVolumePersonalizadoAction(
  codigoEmpresa: string,
  inicioIso: string,
  fimIso: string,
): Promise<VolumeCanalPeriodoAgencia | null> {
  await garantirAcesso();

  if (!FORMATO_DATA_ISO.test(inicioIso) || !FORMATO_DATA_ISO.test(fimIso)) {
    throw new Error("Datas inválidas.");
  }
  if (inicioIso > fimIso) {
    throw new Error("Data inicial não pode ser depois da data final.");
  }

  const baseAgencia = hashParaNumero(codigoEmpresa);
  const baseIntervalo = hashParaNumero(`${codigoEmpresa}:${inicioIso}:${fimIso}`);

  // Volume "ano" mock de referência (mesma faixa usada no restante do
  // adapter pra esta agência) — o intervalo pedido escala esse total
  // proporcionalmente aos dias cobertos, com uma variação mock por hash
  // pra não ficar uma reta perfeita.
  const volumeAnoMock = ((baseAgencia % 900) + 30) * 15_000;
  const diasIntervalo = Math.max(
    1,
    Math.round(
      (new Date(`${fimIso}T00:00:00Z`).getTime() - new Date(`${inicioIso}T00:00:00Z`).getTime()) /
        86_400_000,
    ) + 1,
  );
  const fatorVariacao = 0.85 + ((baseIntervalo >> 3) % 30) / 100;
  const valor = Math.round((volumeAnoMock / 365) * diasIntervalo * fatorVariacao);

  const participacaoAereoPct = 55 + ((baseAgencia >> 5) % 20);
  const volumeAereo = Math.round((valor * participacaoAereoPct) / 100);
  const volumeTerrestre = valor - volumeAereo;

  const ticketMedioAereo = 350 + (baseAgencia % 400);
  const ticketMedioTerrestre = 180 + ((baseAgencia >> 2) % 250);

  return {
    valor,
    volumeAereo,
    volumeTerrestre,
    bilhetesAereo: ticketMedioAereo > 0 ? Math.round(volumeAereo / ticketMedioAereo) : 0,
    ticketMedioAereo,
    servicosTerrestre:
      ticketMedioTerrestre > 0 ? Math.round(volumeTerrestre / ticketMedioTerrestre) : 0,
    ticketMedioTerrestre,
  };
}
