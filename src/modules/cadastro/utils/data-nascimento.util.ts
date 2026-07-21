const IDADE_MINIMA_ANOS = 18;

// Formato ISO (YYYY-MM-DD) — mesmo valor que <input type="date"> produz
// nativamente, sem precisar de máscara própria (convenção já usada no
// formulário de sócio do painel admin, ver usuario-master.tsx).
export function validarDataNascimentoComMensagem(valorIso: string): {
  valido: boolean;
  mensagem: string | null;
} {
  if (valorIso.length === 0) {
    return { valido: false, mensagem: null };
  }

  const data = new Date(`${valorIso}T00:00:00`);
  if (Number.isNaN(data.getTime())) {
    return { valido: false, mensagem: "Data de nascimento inválida." };
  }

  const hoje = new Date();
  if (data > hoje) {
    return { valido: false, mensagem: "Data de nascimento não pode ser no futuro." };
  }

  const limiteIdadeMinima = new Date(
    hoje.getFullYear() - IDADE_MINIMA_ANOS,
    hoje.getMonth(),
    hoje.getDate(),
  );
  if (data > limiteIdadeMinima) {
    return {
      valido: false,
      mensagem: `Sócio deve ser maior de idade (${IDADE_MINIMA_ANOS} anos).`,
    };
  }

  return { valido: true, mensagem: null };
}
