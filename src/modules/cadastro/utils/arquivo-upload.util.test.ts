import {
  TAMANHO_MAXIMO_ARQUIVO_BYTES,
  validarArquivoUpload,
} from "@/modules/cadastro/utils/arquivo-upload.util";

function criarArquivo(nome: string, tipo: string, tamanhoBytes: number): File {
  const conteudo = new Uint8Array(tamanhoBytes);
  return new File([conteudo], nome, { type: tipo });
}

describe("validarArquivoUpload", () => {
  it("aceita PDF, JPG e PNG dentro do limite de tamanho", () => {
    expect(
      validarArquivoUpload(criarArquivo("a.pdf", "application/pdf", 1024), "Arquivo"),
    ).toBeNull();
    expect(validarArquivoUpload(criarArquivo("a.jpg", "image/jpeg", 1024), "Arquivo")).toBeNull();
    expect(validarArquivoUpload(criarArquivo("a.png", "image/png", 1024), "Arquivo")).toBeNull();
  });

  it("rejeita formato fora da lista permitida", () => {
    const erro = validarArquivoUpload(criarArquivo("a.txt", "text/plain", 1024), "Contrato Social");
    expect(erro).toMatch(/formato não permitido/i);
    expect(erro).toContain("Contrato Social");
  });

  it("rejeita arquivo maior que o limite", () => {
    const grandeDemais = criarArquivo("a.pdf", "application/pdf", TAMANHO_MAXIMO_ARQUIVO_BYTES + 1);
    const erro = validarArquivoUpload(grandeDemais, "RG");
    expect(erro).toMatch(/excede o tamanho máximo/i);
  });

  it("aceita arquivo exatamente no limite de tamanho", () => {
    const noLimite = criarArquivo("a.pdf", "application/pdf", TAMANHO_MAXIMO_ARQUIVO_BYTES);
    expect(validarArquivoUpload(noLimite, "RG")).toBeNull();
  });

  it("checa tamanho antes de checar formato (mensagem de tamanho tem prioridade)", () => {
    const grandeEInvalido = criarArquivo("a.txt", "text/plain", TAMANHO_MAXIMO_ARQUIVO_BYTES + 1);
    const erro = validarArquivoUpload(grandeEInvalido, "Arquivo");
    expect(erro).toMatch(/excede o tamanho máximo/i);
  });
});
