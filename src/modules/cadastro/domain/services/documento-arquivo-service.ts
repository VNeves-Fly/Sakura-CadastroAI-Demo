// Serve o conteúdo de um documento já salvo (RG, procuração, contrato
// social) pro analista visualizar no dossiê — diferente de FileStorage
// (que só sabe salvar), esse serviço sabe "devolver" o arquivo de volta.
export type DocumentoArquivoResultado =
  { tipo: "buffer"; buffer: Buffer; mimeType: string } | { tipo: "redirect"; url: string };

export interface DocumentoArquivoService {
  obter(path: string): Promise<DocumentoArquivoResultado>;
}
