ALTER TABLE public.tabela_icms_reducao_pr
  DROP COLUMN percentual_reducao,
  ADD COLUMN aliquota_nominal_icms_pr numeric NOT NULL DEFAULT 0,
  ADD COLUMN valor_deduzir_icms_pr numeric NOT NULL DEFAULT 0;