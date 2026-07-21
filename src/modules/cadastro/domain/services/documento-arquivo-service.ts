// Serve o conteúdo de um documento já salvo (RG, procuração, contrato
// social) pro analista visualizar no dossiê — diferente de FileStorage
// (que só sabe salvar), esse serviço sabe "devolver" o arquivo de volta.
export type DocumentoArquivoResultado =
  { tipo: "buffer"; buffer: Buffer; mimeType: string } | { tipo: "redirect"; url: string };

export interface DocumentoArquivoService {
  // `bucket` é o valor gravado em Documento.gcsBucket na hora do upload —
  // quando presente, prevalece sobre o GCS_BUCKET_NAME do ambiente atual
  // (que pode ter mudado depois do upload). Null pra documentos antigos
  // (gravados antes dessa coluna existir) ou pro LocalDocumentoArquivoAdapter.
  obter(path: string, bucket?: string | null): Promise<DocumentoArquivoResultado>;
}
