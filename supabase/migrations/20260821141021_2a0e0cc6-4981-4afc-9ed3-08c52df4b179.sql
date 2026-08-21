CREATE OR REPLACE FUNCTION public.check_limite_12_lancamentos()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  total integer;
BEGIN
  SELECT count(*) INTO total FROM public.lancamentos_mensais WHERE apuracao_id = NEW.apuracao_id;
  IF total >= 12 THEN
    RAISE EXCEPTION 'Esta apuração já tem os 12 meses completos.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_limite_12_lancamentos ON public.lancamentos_mensais;
CREATE TRIGGER trg_limite_12_lancamentos
BEFORE INSERT ON public.lancamentos_mensais
FOR EACH ROW EXECUTE FUNCTION public.check_limite_12_lancamentos();