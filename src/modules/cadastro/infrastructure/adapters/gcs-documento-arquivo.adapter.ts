import { Storage } from "@google-cloud/storage";
import type {
  DocumentoArquivoResultado,
  DocumentoArquivoService,
} from "@/modules/cadastro/domain/services/documento-arquivo-service";

const storage = new Storage();
const SIGNED_URL_TTL_MS = 5 * 60 * 1000;

export class GcsDocumentoArquivoAdapter implements DocumentoArquivoService {
  constructor(private readonly bucketNamePadrao: string = requireBucketName()) {}

  // Prefere o bucket gravado no próprio documento (Documento.gcsBucket) —
  // se o GCS_BUCKET_NAME do ambiente mudar depois do upload (rename,
  // migração de bucket), documentos antigos continuam legíveis em vez de
  // virarem NoSuchKey. Só cai pro bucket padrão quando `bucket` é null
  // (documento antigo, gravado antes dessa coluna existir).
  async obter(path: string, bucket?: string | null): Promise<DocumentoArquivoResultado> {
    const [url] = await storage
      .bucket(bucket ?? this.bucketNamePadrao)
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
