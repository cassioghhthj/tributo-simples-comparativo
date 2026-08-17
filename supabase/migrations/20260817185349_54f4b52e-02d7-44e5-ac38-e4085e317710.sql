CREATE TABLE public.empresas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  cnpj TEXT,
  atividade TEXT,
  anexo_predominante TEXT NOT NULL DEFAULT 'III',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.parametros_empresa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL UNIQUE REFERENCES public.empresas(id) ON DELETE CASCADE,
  perc_iss NUMERIC(7,4) NOT NULL DEFAULT 5,
  perc_presuncao_servico NUMERIC(7,4) NOT NULL DEFAULT 32,
  perc_presuncao_comercio NUMERIC(7,4) NOT NULL DEFAULT 8,
  perc_icms NUMERIC(7,4) NOT NULL DEFAULT 0,
  perc_ipi NUMERIC(7,4) NOT NULL DEFAULT 0,
  perc_inss_prolabore NUMERIC(7,4) NOT NULL DEFAULT 11,
  perc_encargo_patronal NUMERIC(7,4) NOT NULL DEFAULT 20,
  prolabore_padrao NUMERIC(14,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.tabela_simples_nacional (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ano_vigencia INTEGER NOT NULL,
  anexo TEXT NOT NULL,
  faixa SMALLINT NOT NULL,
  receita_min NUMERIC(16,2) NOT NULL,
  receita_max NUMERIC(16,2),
  aliquota_nominal NUMERIC(9,6) NOT NULL,
  valor_deduzir NUMERIC(16,2) NOT NULL DEFAULT 0,
  rep_irpj NUMERIC(9,6) NOT NULL DEFAULT 0,
  rep_csll NUMERIC(9,6) NOT NULL DEFAULT 0,
  rep_cofins NUMERIC(9,6) NOT NULL DEFAULT 0,
  rep_pis NUMERIC(9,6) NOT NULL DEFAULT 0,
  rep_cpp NUMERIC(9,6) NOT NULL DEFAULT 0,
  rep_icms NUMERIC(9,6) NOT NULL DEFAULT 0,
  rep_iss NUMERIC(9,6) NOT NULL DEFAULT 0,
  rep_ipi NUMERIC(9,6) NOT NULL DEFAULT 0,
  limite_aliquota_efetiva_iss NUMERIC(9,6),
  iss_fixo_percentual NUMERIC(9,6),
  peso_redist_irpj NUMERIC(9,6),
  peso_redist_csll NUMERIC(9,6),
  peso_redist_cofins NUMERIC(9,6),
  peso_redist_pis NUMERIC(9,6),
  peso_redist_cpp NUMERIC(9,6),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (ano_vigencia, anexo, faixa)
);

CREATE TABLE public.tabela_icms_reducao_pr (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ano_vigencia INTEGER NOT NULL,
  tipo TEXT NOT NULL,
  faixa SMALLINT NOT NULL,
  receita_min NUMERIC(16,2) NOT NULL,
  receita_max NUMERIC(16,2),
  percentual_reducao NUMERIC(9,6) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (ano_vigencia, tipo, faixa)
);

CREATE TABLE public.apuracoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  descricao TEXT,
  ano_inicial INTEGER NOT NULL,
  mes_inicial SMALLINT NOT NULL,
  ano_tabela INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.apuracao_semente (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  apuracao_id UUID NOT NULL REFERENCES public.apuracoes(id) ON DELETE CASCADE,
  ano INTEGER NOT NULL,
  mes SMALLINT NOT NULL,
  rbt NUMERIC(16,2) NOT NULL DEFAULT 0,
  folha NUMERIC(16,2) NOT NULL DEFAULT 0,
  UNIQUE (apuracao_id, ano, mes)
);

CREATE TABLE public.lancamentos_mensais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  apuracao_id UUID NOT NULL REFERENCES public.apuracoes(id) ON DELETE CASCADE,
  ano INTEGER NOT NULL,
  mes SMALLINT NOT NULL,
  fat_anexo_i NUMERIC(16,2) NOT NULL DEFAULT 0,
  fat_anexo_ii NUMERIC(16,2) NOT NULL DEFAULT 0,
  fat_anexo_iii NUMERIC(16,2) NOT NULL DEFAULT 0,
  fat_anexo_iv NUMERIC(16,2) NOT NULL DEFAULT 0,
  fat_anexo_v NUMERIC(16,2) NOT NULL DEFAULT 0,
  folha NUMERIC(16,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (apuracao_id, ano, mes)
);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$
LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_empresas_updated BEFORE UPDATE ON public.empresas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_parametros_updated BEFORE UPDATE ON public.parametros_empresa FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_lancamentos_updated BEFORE UPDATE ON public.lancamentos_mensais FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

GRANT SELECT, INSERT, UPDATE, DELETE ON public.empresas TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.parametros_empresa TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tabela_simples_nacional TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tabela_icms_reducao_pr TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.apuracoes TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.apuracao_semente TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lancamentos_mensais TO anon, authenticated;
GRANT ALL ON public.empresas, public.parametros_empresa, public.tabela_simples_nacional, public.tabela_icms_reducao_pr, public.apuracoes, public.apuracao_semente, public.lancamentos_mensais TO service_role;

ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parametros_empresa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tabela_simples_nacional ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tabela_icms_reducao_pr ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.apuracoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.apuracao_semente ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lancamentos_mensais ENABLE ROW LEVEL SECURITY;

CREATE POLICY "acesso_publico_empresas" ON public.empresas FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "acesso_publico_parametros" ON public.parametros_empresa FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "acesso_publico_tabela_sn" ON public.tabela_simples_nacional FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "acesso_publico_tabela_icms" ON public.tabela_icms_reducao_pr FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "acesso_publico_apuracoes" ON public.apuracoes FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "acesso_publico_semente" ON public.apuracao_semente FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "acesso_publico_lancamentos" ON public.lancamentos_mensais FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);