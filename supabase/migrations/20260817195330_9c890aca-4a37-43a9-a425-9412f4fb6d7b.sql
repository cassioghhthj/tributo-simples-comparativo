ALTER TABLE public.lancamentos_mensais
  ADD COLUMN IF NOT EXISTS isento_icms numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS isento_iss numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS isento_pis_cofins numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS isento_ipi numeric NOT NULL DEFAULT 0;