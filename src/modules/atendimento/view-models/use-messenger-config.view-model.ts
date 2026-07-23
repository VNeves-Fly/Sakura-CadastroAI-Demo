import { useCallback, useEffect, useState } from "react";
import type {
  ConfiguracaoWhatsappBusiness,
  TemplateAprovado,
  CriarTemplateInput,
} from "@/modules/atendimento/types/atendimento.types";
import { atendimentoApi } from "@/modules/atendimento/services/atendimento-api";

export function useMessengerConfig(analistaAtual: string) {
  const [configuracao, setConfiguracao] = useState<ConfiguracaoWhatsappBusiness | null>(null);
  const [templates, setTemplates] = useState<TemplateAprovado[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSalvando, setIsSalvando] = useState(false);
  const [isCriandoTemplate, setIsCriandoTemplate] = useState(false);

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

  return {
    configuracao,
    templates,
    isLoading,
    isSalvando,
    isCriandoTemplate,
    salvarConfiguracao,
    criarTemplate,
  };
}
