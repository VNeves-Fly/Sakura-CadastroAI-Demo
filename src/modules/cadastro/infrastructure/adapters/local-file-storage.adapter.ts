import { mkdir, writeFile } from "fs/promises";
import { dirname, extname, join } from "path";
import type {
  FileStorage,
  SavedFile,
  StoredFileInput,
} from "@/modules/cadastro/domain/services/file-storage";

const UPLOAD_ROOT = join(process.cwd(), "uploads");

export class LocalFileStorage implements FileStorage {
  async save(file: StoredFileInput, pathHint: string): Promise<SavedFile> {
    const extension = extname(file.originalName);
    const relativePath = `${pathHint}${extension}`;
    const absolutePath = join(UPLOAD_ROOT, relativePath);

    await mkdir(dirname(absolutePath), { recursive: true });
    await writeFile(absolutePath, file.buffer);

    return { path: relativePath, bucket: null };
  }
}
