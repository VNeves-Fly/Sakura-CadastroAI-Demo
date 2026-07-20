import { Storage } from "@google-cloud/storage";
import { extname } from "path";
import type {
  FileStorage,
  SavedFile,
  StoredFileInput,
} from "@/modules/cadastro/domain/services/file-storage";

// Credenciais via Application Default Credentials (GOOGLE_APPLICATION_CREDENTIALS
// apontando pro JSON da service account) ou ambiente já autenticado (Cloud Run/GCE).
const storage = new Storage();

export class GcsFileStorage implements FileStorage {
  constructor(
    private readonly bucketName: string = requireBucketName(),
    private readonly folderPrefix: string = process.env.GCS_FOLDER_PREFIX ?? "",
  ) {}

  async save(file: StoredFileInput, pathHint: string): Promise<SavedFile> {
    const extension = extname(file.originalName);
    const prefix = this.folderPrefix ? `${this.folderPrefix}/` : "";
    const objectPath = `${prefix}${pathHint}-${Date.now()}${extension}`;

    await storage
      .bucket(this.bucketName)
      .file(objectPath)
      .save(file.buffer, { contentType: file.mimeType });

    return { path: objectPath, bucket: this.bucketName };
  }
}

function requireBucketName(): string {
  const bucketName = process.env.GCS_BUCKET_NAME;
  if (!bucketName) {
    throw new Error("GCS_BUCKET_NAME não configurada — necessária para GcsFileStorage.");
  }
  return bucketName;
}
