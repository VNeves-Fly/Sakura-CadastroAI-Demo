import type { SstService } from "@/modules/cadastro/domain/services/sst-service";

export interface ResultadoTesteConexaoSstOutput {
  sucesso: boolean;
  mensagem: string;
  databases?: Record<string, string>;
}

export class TestarConexaoSstUseCase {
  constructor(private readonly sstService: SstService) {}

  async execute(): Promise<ResultadoTesteConexaoSstOutput> {
    try {
      const { status, databases } = await this.sstService.verificarConexao();
      return {
        sucesso: true,
        mensagem: `SST respondeu "${status}".`,
        databases,
      };
    } catch (error) {
      return {
        sucesso: false,
        mensagem: error instanceof Error ? error.message : "Falha ao conectar com o SST.",
      };
    }
  }
}
