export interface StoredFileInput {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
}

export interface FileStorage {
  save(file: StoredFileInput, pathHint: string): Promise<string>;
}
