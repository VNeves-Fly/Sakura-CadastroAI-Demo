"use client";

import { useEffect } from "react";

export function ConsoleBanner() {
  useEffect(() => {
    console.clear();
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
