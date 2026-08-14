// Deriva firstName/lastName (campos do User) a partir do nome único
// coletado no form de Gestor/Promotor — evita pedir nome duas vezes quando
// "Criar acesso na plataforma" é marcado. Primeira palavra = firstName,
// resto = lastName (vazio se o nome não tiver sobrenome).
export function partirNome(nomeCompleto: string): { firstName: string; lastName: string } {
  const partes = nomeCompleto.trim().split(/\s+/);
  const [firstName, ...resto] = partes;
  return { firstName: firstName ?? nomeCompleto, lastName: resto.join(" ") };
}
