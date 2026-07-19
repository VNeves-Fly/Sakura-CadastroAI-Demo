// Única camada autorizada a se comunicar com a API externa (/api/users/trocar-senha).
export const changePasswordService = {
  async change(newPassword: string): Promise<void> {
    const response = await fetch("/api/users/trocar-senha", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newPassword }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      throw new Error(payload?.error ?? "Não foi possível trocar a senha.");
    }
  },
};
