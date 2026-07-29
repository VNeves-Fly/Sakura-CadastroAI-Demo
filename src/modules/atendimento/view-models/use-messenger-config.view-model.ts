import { useCallback, useEffect, useState } from "react";
import type {
  ConfiguracaoWhatsappBusiness,
  TemplateAprovado,
  CriarTemplateInput,
  AtualizarTemplateMetadataInput,
  ResultadoTesteConexao,
} from "@/modules/atendimento/types/atendimento.types";
import { atendimentoApi } from "@/modules/atendimento/services/atendimento-api";

export function useMessengerConfig(analistaAtual: string) {
  const [configuracao, setConfiguracao] = useState<ConfiguracaoWhatsappBusiness | null>(null);
  const [templates, setTemplates] = useState<TemplateAprovado[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSalvando, setIsSalvando] = useState(false);
  const [isCriandoTemplate, setIsCriandoTemplate] = useState(false);
  const [isTestandoConexao, setIsTestandoConexao] = useState(false);
  const [resultadoTeste, setResultadoTeste] = useState<ResultadoTesteConexao | null>(null);
  const [isSincronizando, setIsSincronizando] = useState(false);

  const carregarTudo = useCallback(async () => {
    setIsLoading(true);
    try {
      const [configCarregada, templatesCarregados] = await Promise.all([
        atendimentoApi.obterConfiguracaoWhatsapp(),
        atendimentoApi.listarTemplates(),
      ]);
      setConfiguracao(configCarregada);
      setTemplates(templatesCarregados);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void carregarTudo();
  }, [carregarTudo]);

  const salvarConfiguracao = useCallback(
    async (input: {
      appId: string;
      appSecret: string;
      whatsappBusinessAccountId: string;
      phoneNumberId: string;
      numeroTelefoneExibicao: string;
      accessToken: string;
      webhookVerifyToken: string;
    }) => {
      setIsSalvando(true);
      try {
        const atualizada = await atendimentoApi.salvarConfiguracaoWhatsapp({
          ...input,
          salvoPor: analistaAtual,
        });
        setConfiguracao(atualizada);
      } finally {
        setIsSalvando(false);
      }
    },
    [analistaAtual],
  );

  const criarTemplate = useCallback(async (input: CriarTemplateInput) => {
    setIsCriandoTemplate(true);
    try {
      const novo = await atendimentoApi.criarTemplate(input);
      setTemplates((atual) => [...atual, novo]);
    } finally {
      setIsCriandoTemplate(false);
    }
  }, []);

  const reenviarTemplate = useCallback(async (id: string, novoConteudo: string) => {
    const atualizado = await atendimentoApi.reenviarTemplate(id, novoConteudo);
    setTemplates((atual) => atual.map((template) => (template.id === id ? atualizado : template)));
  }, []);

  const atualizarTemplateMetadata = useCallback(
    async (id: string, input: AtualizarTemplateMetadataInput) => {
      const atualizado = await atendimentoApi.atualizarTemplateMetadata(id, input);
      setTemplates((atual) =>
        atual.map((template) => (template.id === id ? atualizado : template)),
      );
    },
    [],
  );

  const testarConexao = useCallback(async () => {
    setIsTestandoConexao(true);
    setResultadoTeste(null);
    try {
      const resultado = await atendimentoApi.testarConexaoWhatsapp();
      setResultadoTeste(resultado);
    } finally {
      setIsTestandoConexao(false);
    }
  }, []);

  const sincronizarTemplates = useCallback(async () => {
    setIsSincronizando(true);
    try {
      await atendimentoApi.sincronizarTemplates();
      setTemplates(await atendimentoApi.listarTemplates());
    } finally {
      setIsSincronizando(false);
    }
  }, []);

  return {
    configuracao,
    templates,
    isLoading,
    isSalvando,
    isCriandoTemplate,
    isTestandoConexao,
    resultadoTeste,
    isSincronizando,
    salvarConfiguracao,
    criarTemplate,
    reenviarTemplate,
    atualizarTemplateMetadata,
    testarConexao,
    sincronizarTemplates,
  };
}
