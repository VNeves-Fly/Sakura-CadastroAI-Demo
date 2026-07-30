-- Notifica em tempo real (pg_notify) pedidos de transferência/assunção de
-- atendimento do CADASTRO da agência — canal próprio, não reaproveita
-- "atendimento_eventos" (que é do chat/Conversa, payload diferente). Ver
-- docs/realtime-sse.md.
CREATE OR REPLACE FUNCTION notificar_solicitacao_atendimento_agencia_evento() RETURNS trigger AS $$
BEGIN
  PERFORM pg_notify('solicitacao_atendimento_agencia_eventos', json_build_object(
    'solicitacaoId', NEW.id,
    'agenciaId', NEW."agenciaId",
    'tipo', NEW.tipo,
    'status', NEW.status,
    'solicitanteId', NEW."solicitanteId",
    'atendenteAtualId', NEW."atendenteAtualId",
    'novoAtendenteId', NEW."novoAtendenteId"
  )::text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_notify_solicitacoes_atendimento_agencia
  AFTER INSERT OR UPDATE ON "solicitacoes_atendimento_agencia"
  FOR EACH ROW EXECUTE FUNCTION notificar_solicitacao_atendimento_agencia_evento();
