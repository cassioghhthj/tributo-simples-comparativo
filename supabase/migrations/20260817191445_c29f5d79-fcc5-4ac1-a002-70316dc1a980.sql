DROP POLICY IF EXISTS acesso_publico_empresas ON public.empresas;
DROP POLICY IF EXISTS acesso_publico_parametros ON public.parametros_empresa;
DROP POLICY IF EXISTS acesso_publico_apuracoes ON public.apuracoes;
DROP POLICY IF EXISTS acesso_publico_semente ON public.apuracao_semente;
DROP POLICY IF EXISTS acesso_publico_lancamentos ON public.lancamentos_mensais;
DROP POLICY IF EXISTS acesso_publico_tabela_sn ON public.tabela_simples_nacional;
DROP POLICY IF EXISTS acesso_publico_tabela_icms ON public.tabela_icms_reducao_pr;

REVOKE ALL ON public.empresas FROM anon;
REVOKE ALL ON public.parametros_empresa FROM anon;
REVOKE ALL ON public.apuracoes FROM anon;
REVOKE ALL ON public.apuracao_semente FROM anon;
REVOKE ALL ON public.lancamentos_mensais FROM anon;
REVOKE ALL ON public.tabela_simples_nacional FROM anon;
REVOKE ALL ON public.tabela_icms_reducao_pr FROM anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.empresas TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.parametros_empresa TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.apuracoes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.apuracao_semente TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lancamentos_mensais TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tabela_simples_nacional TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tabela_icms_reducao_pr TO authenticated;

GRANT ALL ON public.empresas TO service_role;
GRANT ALL ON public.parametros_empresa TO service_role;
GRANT ALL ON public.apuracoes TO service_role;
GRANT ALL ON public.apuracao_semente TO service_role;
GRANT ALL ON public.lancamentos_mensais TO service_role;
GRANT ALL ON public.tabela_simples_nacional TO service_role;
GRANT ALL ON public.tabela_icms_reducao_pr TO service_role;

CREATE POLICY acesso_autenticado_empresas ON public.empresas FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY acesso_autenticado_parametros ON public.parametros_empresa FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY acesso_autenticado_apuracoes ON public.apuracoes FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY acesso_autenticado_semente ON public.apuracao_semente FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY acesso_autenticado_lancamentos ON public.lancamentos_mensais FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY acesso_autenticado_tabela_sn ON public.tabela_simples_nacional FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY acesso_autenticado_tabela_icms ON public.tabela_icms_reducao_pr FOR ALL TO authenticated USING (true) WITH CHECK (true);