// "Último acesso {hoje | há 2 dias | há 12 dias | nunca}" — SPEC seção 2.3.
// `agora` é injetável só pra facilitar teste; produção sempre usa new Date().
export function formatarUltimoAcesso(lastLoginAt: string | null, agora = new Date()): string {
  if (!lastLoginAt) return "nunca";

  const dataAcesso = new Date(lastLoginAt);
  const inicioHoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
  const inicioAcesso = new Date(
    dataAcesso.getFullYear(),
    dataAcesso.getMonth(),
    dataAcesso.getDate(),
  );
  const diffDias = Math.round((inicioHoje.getTime() - inicioAcesso.getTime()) / 86_400_000);

  if (diffDias <= 0) return "hoje";
  if (diffDias === 1) return "há 1 dia";
  return `há ${diffDias} dias`;
}
