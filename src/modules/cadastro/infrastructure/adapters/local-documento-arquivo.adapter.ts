import { readFile } from "fs/promises";
import { extname, join } from "path";
import type {
  DocumentoArquivoResultado,
  DocumentoArquivoService,
} from "@/modules/cadastro/domain/services/documento-arquivo-service";

const UPLOAD_ROOT = join(process.cwd(), "uploads");

// LocalFileStorage não grava mimeType nenhum lugar (nem no disco, nem no
// Documento) — infere pela extensão, cobrindo os tipos que o upload de
// cadastro aceita (ver arquivo-upload.util.ts).
const MIME_POR_EXTENSAO: Record<string, string> = {
  ".pdf": "application/pdf",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
};

export class LocalDocumentoArquivoAdapter implements DocumentoArquivoService {
  // Sem bucket no disco local — parâmetro existe só pra cumprir a
  // interface (ver GcsDocumentoArquivoAdapter, que de fato usa).
  async obter(path: string): Promise<DocumentoArquivoResultado> {
    const buffer = await readFile(join(UPLOAD_ROOT, path));
    const mimeType = MIME_POR_EXTENSAO[extname(path).toLowerCase()] ?? "application/octet-stream";
    return { tipo: "buffer", buffer, mimeType };
  }
}
