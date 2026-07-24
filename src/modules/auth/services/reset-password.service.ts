// Única camada autorizada a se comunicar com a API externa (/api/users/recuperar-senha/verificar
// e /api/users/redefinir-senha).
export const resetPasswordService = {
  async verifyCode(token: string, codigo: string): Promise<void> {
    const response = await fetch("/api/users/recuperar-senha/verificar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, codigo }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      throw new Error(payload?.error ?? "Não foi possível verificar o código.");
    }
  },

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const response = await fetch("/api/users/redefinir-senha", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, newPassword }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      throw new Error(payload?.error ?? "Não foi possível trocar a senha.");
    }
  },
};
