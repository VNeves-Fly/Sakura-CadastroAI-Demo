import type {
  QsaConsultaService,
  QsaResult,
} from "@/modules/cadastro/domain/services/qsa-consulta-service";

const NOMES_MOCK = ["Ana Paula Ferreira", "Bruno Costa Lima", "Carla Menezes Rocha"];

// Sem integração real com a Receita Federal (sem credencial/API disponível
// neste projeto ainda). Gera um resultado determinístico a partir do CNPJ,
// só pra o fluxo ponta a ponta (front + validação de sócios) funcionar até
// a integração real ser conectada nesta mesma porta (QsaConsultaService).
export class MockQsaConsultaService implements QsaConsultaService {
  async consultar(cnpj: string): Promise<QsaResult | null> {
    const seed = this.seedFromCnpj(cnpj);
    const quantidadeSocios = (seed % NOMES_MOCK.length) + 1;

    return {
      cnpj,
      razaoSocial: `Agência ${cnpj.slice(0, 8)} Ltda`,
      cnaeCompativel: true,
      socios: NOMES_MOCK.slice(0, quantidadeSocios).map((nome) => ({ nome })),
    };
  }

  private seedFromCnpj(cnpj: string): number {
    return cnpj.split("").reduce((total, char) => total + char.charCodeAt(0), 0);
  }
}
