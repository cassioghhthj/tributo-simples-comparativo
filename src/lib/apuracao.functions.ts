import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

import {
  calcularApuracao,
  type FaixaIcmsPr,
  type FaixaSimples,
  type Lancamento,
  type ParametrosEmpresa,
  type ResultadoMes,
  type SementeMes,
} from "./calculo";

export interface RetornoApuracao {
  empresa: { id: string; nome: string; cnpj: string | null; anexo_predominante: string };
  apuracao: { id: string; ano_inicial: number; mes_inicial: number; ano_tabela: number; descricao: string | null };
  resultados: ResultadoMes[];
  tabelasCarregadas: { simples: number; icmsPr: number };
}

export const calcularApuracaoFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ apuracaoId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }): Promise<RetornoApuracao> => {
    const supabase = context.supabase;
    const { data: apuracao, error: eAp } = await supabase

      .from("apuracoes")
      .select("id, empresa_id, ano_inicial, mes_inicial, ano_tabela, descricao")
      .eq("id", data.apuracaoId)
      .single();
    if (eAp || !apuracao) throw new Error(eAp?.message ?? "Apuração não encontrada");

    const [empresaRes, paramRes, sementeRes, lancRes, snRes, icmsRes] = await Promise.all([
      supabase
        .from("empresas")
        .select("id, nome, cnpj, anexo_predominante")
        .eq("id", apuracao.empresa_id)
        .single(),
      supabase.from("parametros_empresa").select("*").eq("empresa_id", apuracao.empresa_id).maybeSingle(),
      supabase.from("apuracao_semente").select("ano, mes, rbt, folha").eq("apuracao_id", apuracao.id),
      supabase.from("lancamentos_mensais").select("*").eq("apuracao_id", apuracao.id),
      supabase.from("tabela_simples_nacional").select("*").eq("ano_vigencia", apuracao.ano_tabela),
      supabase.from("tabela_icms_reducao_pr").select("*").eq("ano_vigencia", apuracao.ano_tabela),
    ]);

    if (empresaRes.error || !empresaRes.data) throw new Error("Empresa não encontrada");

    const parametros: ParametrosEmpresa = (paramRes.data as ParametrosEmpresa | null) ?? {
      perc_iss: 5,
      perc_presuncao_servico: 32,
      perc_presuncao_comercio: 8,
      perc_icms: 0,
      perc_ipi: 0,
      perc_inss_prolabore: 11,
      perc_encargo_patronal: 20,
      prolabore_padrao: 0,
    };

    const resultados = calcularApuracao({
      semente: (sementeRes.data ?? []) as unknown as SementeMes[],
      lancamentos: (lancRes.data ?? []) as unknown as Lancamento[],
      parametros,
      tabelaSimples: (snRes.data ?? []) as unknown as FaixaSimples[],
      tabelaIcmsPr: (icmsRes.data ?? []) as unknown as FaixaIcmsPr[],
    });

    return {
      empresa: empresaRes.data,
      apuracao,
      resultados,
      tabelasCarregadas: { simples: snRes.data?.length ?? 0, icmsPr: icmsRes.data?.length ?? 0 },
    };
  });
