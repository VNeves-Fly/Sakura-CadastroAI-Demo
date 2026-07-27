-- Acrescenta o id da linha ao payload de "cadastro_eventos" — sem isso,
-- um consumidor (ex.: notificação global de novo documento) só sabe QUAL
-- agência mudou, não qual linha exatamente, o que é ambíguo quando várias
-- linhas de "documentos" são inseridas quase juntas (ex.: submissão
-- inicial do wizard, que cria contrato social + RG de cada sócio na
-- mesma transação). Mesma function, só troca o corpo — não recria
-- nenhum trigger.
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
    'id', NEW.id,
    'tipo', TG_OP
  )::text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
