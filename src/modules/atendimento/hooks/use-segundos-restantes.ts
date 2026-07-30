import { useEffect, useState } from "react";

// Contagem regressiva client-side a partir de um timestamp absoluto vindo
// do servidor (criadaEm) — nunca um "segundos restantes" mutável, pra
// remetente/destinatário calcularem o mesmo valor de forma independente
// mas consistente. Extraído do banner de transferência do chat
// (atendimento-acoes-banner.tsx) pra ser reaproveitado também pelo toast
// de atendimento do cadastro — mesmo comportamento, timeout configurável.
export function useSegundosRestantes(criadaEm: string, timeoutMs: number): number {
  const [restanteMs, setRestanteMs] = useState(() =>
    Math.max(0, timeoutMs - (Date.now() - new Date(criadaEm).getTime())),
  );

  useEffect(() => {
    const intervalo = setInterval(() => {
      setRestanteMs(Math.max(0, timeoutMs - (Date.now() - new Date(criadaEm).getTime())));
    }, 1000);
    return () => clearInterval(intervalo);
  }, [criadaEm, timeoutMs]);

  return Math.ceil(restanteMs / 1000);
}
