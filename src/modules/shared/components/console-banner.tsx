"use client";

import { useEffect } from "react";

export function ConsoleBanner() {
  useEffect(() => {
    // eslint-disable-next-line no-console -- banner deliberado pro console do navegador, não debug leftover.
    console.clear();
    // eslint-disable-next-line no-console -- idem.
    console.log(`
🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸

          S A K U R A

      ✿ Bem-vindo, desenvolvedor ✿

Este console é destinado apenas para
depuração da aplicação.

⚠️ Nunca execute códigos enviados
por terceiros.

🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸
`);
  }, []);

  return null;
}
