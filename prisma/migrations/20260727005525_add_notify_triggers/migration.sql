-- Notifica mudanças em tempo real via pg_notify, consumidas pelas rotas SSE
-- (/api/cadastros/eventos, /api/cadastros/[id]/eventos, /api/atendimento/eventos)
-- em vez de qualquer polling client-side.

-- Canal "cadastro_eventos": tabela + agenciaId + tipo de operação. Cobre a
-- lista /cadastros (só interessada em tabela = 'agencias') e o dossiê
-- /cadastros/[id] (interessado em agencias/documentos/contratos/
-- representantes_legais filtrando por agenciaId).
CREATE OR REPLACE FUNCTION notificar_cadastro_evento() RETURNS trigger AS $$
DECLARE
  v_agencia_id TEXT;
BEGIN
  IF TG_TABLE_NAME = 'agencias' THEN
    v_agencia_id := NEW.id;
  ELSE
    v_agencia_id := NEW."agenciaId";
  END IF;

  PERFORM pg_notify('cadastro_eventos', json_build_object(
    'tabela', TG_TABLE_NAME,
    'agenciaId', v_agencia_id,
    'tipo', TG_OP
  )::text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_notify_agencias
  AFTER INSERT OR UPDATE ON "agencias"
  FOR EACH ROW EXECUTE FUNCTION notificar_cadastro_evento();

CREATE TRIGGER trg_notify_documentos
  AFTER INSERT OR UPDATE ON "documentos"
  FOR EACH ROW EXECUTE FUNCTION notificar_cadastro_evento();

CREATE TRIGGER trg_notify_contratos
  AFTER INSERT OR UPDATE ON "contratos"
  FOR EACH ROW EXECUTE FUNCTION notificar_cadastro_evento();

CREATE TRIGGER trg_notify_representantes_legais
  AFTER INSERT OR UPDATE ON "representantes_legais"
  FOR EACH ROW EXECUTE FUNCTION notificar_cadastro_evento();

-- Canal "atendimento_eventos": só conversaId — o front sempre refaz
-- listarConversas() por completo ao receber o evento, igual ao polling que
-- este canal substitui.
CREATE OR REPLACE FUNCTION notificar_atendimento_evento() RETURNS trigger AS $$
DECLARE
  v_conversa_id TEXT;
BEGIN
  IF TG_TABLE_NAME = 'conversas' THEN
    v_conversa_id := NEW.id;
  ELSE
    v_conversa_id := NEW."conversaId";
  END IF;

  PERFORM pg_notify('atendimento_eventos', json_build_object(
    'conversaId', v_conversa_id
  )::text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_notify_mensagens
  AFTER INSERT ON "mensagens"
  FOR EACH ROW EXECUTE FUNCTION notificar_atendimento_evento();

CREATE TRIGGER trg_notify_assumir_atendimento
  AFTER INSERT OR UPDATE ON "assumir_atendimento_registros"
  FOR EACH ROW EXECUTE FUNCTION notificar_atendimento_evento();

CREATE TRIGGER trg_notify_solicitacoes_transferencia
  AFTER INSERT OR UPDATE ON "solicitacoes_transferencia"
  FOR EACH ROW EXECUTE FUNCTION notificar_atendimento_evento();
