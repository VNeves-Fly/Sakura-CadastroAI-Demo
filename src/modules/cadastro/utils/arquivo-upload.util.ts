export const TAMANHO_MAXIMO_ARQUIVO_BYTES = 20 * 1024 * 1024;

const TIPOS_MIME_PERMITIDOS = new Set(["application/pdf", "image/jpeg", "image/jpg", "image/png"]);

// Validação compartilhada entre front (feedback imediato no FileDropInput)
// e back (rota, que é a fronteira de confiança real — o accept do input
// é só uma dica de UI, facilmente contornável).
export function validarArquivoUpload(file: File, rotulo: string): string | null {
  if (file.size > TAMANHO_MAXIMO_ARQUIVO_BYTES) {
    return `${rotulo} excede o tamanho máximo de 20MB.`;
  }
  if (!TIPOS_MIME_PERMITIDOS.has(file.type)) {
    return `${rotulo} tem um formato não permitido. Envie PDF, JPG ou PNG.`;
  }
  return null;
}
