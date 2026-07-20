export interface StoredFileInput {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
}

export interface SavedFile {
  path: string;
  // Bucket onde o arquivo foi de fato salvo (null pro LocalFileStorage,
  // que não tem bucket) — precisa ser gravado junto do path (ver
  // Documento.gcsBucket) porque o bucket "atual" (GCS_BUCKET_NAME do
  // ambiente) pode mudar depois do upload, e sem isso não tem como saber
  // em qual bucket um arquivo já salvo realmente está.
  bucket: string | null;
}

export interface FileStorage {
  save(file: StoredFileInput, pathHint: string): Promise<SavedFile>;
}
