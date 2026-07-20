import { Storage } from "@google-cloud/storage";
import type {
  DocumentoArquivoResultado,
  DocumentoArquivoService,
} from "@/modules/cadastro/domain/services/documento-arquivo-service";

const storage = new Storage();
const SIGNED_URL_TTL_MS = 5 * 60 * 1000;

export class GcsDocumentoArquivoAdapter implements DocumentoArquivoService {
  constructor(private readonly bucketName: string = requireBucketName()) {}

  async obter(path: string): Promise<DocumentoArquivoResultado> {
    const [url] = await storage
      .bucket(this.bucketName)
      .file(path)
      .getSignedUrl({ action: "read", expires: Date.now() + SIGNED_URL_TTL_MS });
    return { tipo: "redirect", url };
  }
}

function requireBucketName(): string {
  const bucketName = process.env.GCS_BUCKET_NAME;
  if (!bucketName) {
    throw new Error(
      "GCS_BUCKET_NAME não configurada — necessária para GcsDocumentoArquivoAdapter.",
    );
  }
  return bucketName;
}
