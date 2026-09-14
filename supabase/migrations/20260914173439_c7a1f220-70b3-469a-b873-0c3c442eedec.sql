ALTER TABLE public.parametros_empresa
  ADD COLUMN IF NOT EXISTS perc_cpp_patronal numeric NOT NULL DEFAULT 20,
  ADD COLUMN IF NOT EXISTS perc_terceiros numeric NOT NULL DEFAULT 5.8,
  ADD COLUMN IF NOT EXISTS perc_rat numeric NOT NULL DEFAULT 2;

UPDATE public.parametros_empresa
SET perc_cpp_patronal = 20, perc_terceiros = 5.8, perc_rat = 2;