// Única camada autorizada a se comunicar com a API externa (/api/users/recuperar-senha).
export const forgotPasswordService = {
  async request(email: string): Promise<void> {
    const response = await fetch("/api/users/recuperar-senha", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      throw new Error(payload?.error ?? "Não foi possível enviar o e-mail de recuperação.");
    }
  },
};
