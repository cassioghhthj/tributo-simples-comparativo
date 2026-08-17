/**
 * Motor de cálculo tributário (Simples Nacional x Lucro Presumido).
 * Funções puras — executadas no servidor a partir de calculo.functions.ts.
 */

export type AnexoKey = "I" | "II" | "III" | "IV" | "V";

export interface FaixaSimples {
  anexo: string;
  faixa: number;
  receita_min: number;
  receita_max: number | null;
  aliquota_nominal: number;
  valor_deduzir: number;
  rep_irpj: number;
  rep_csll: number;
  rep_cofins: number;
  rep_pis: number;
  rep_cpp: number;
  rep_icms: number;
  rep_iss: number;
  rep_ipi: number;
  limite_aliquota_efetiva_iss: number | null;
  iss_fixo_percentual: number | null;
  peso_redist_irpj: number | null;
  peso_redist_csll: number | null;
  peso_redist_cofins: number | null;
  peso_redist_pis: number | null;
  peso_redist_cpp: number | null;
}

export interface FaixaIcmsPr {
  tipo: string;
  faixa: number;
  receita_min: number;
  receita_max: number | null;
  percentual_reducao: number;
}

export interface ParametrosEmpresa {
  perc_iss: number;
  perc_presuncao_servico: number;
  perc_presuncao_comercio: number;
  perc_icms: number;
  perc_ipi: number;
  perc_inss_prolabore: number;
  perc_encargo_patronal: number;
  prolabore_padrao: number;
}

export interface Lancamento {
  ano: number;
  mes: number;
  fat_anexo_i: number;
  fat_anexo_ii: number;
  fat_anexo_iii: number;
  fat_anexo_iv: number;
  fat_anexo_v: number;
  folha: number;
  isento_icms?: number | null;
  isento_iss?: number | null;
  isento_pis_cofins?: number | null;
  isento_ipi?: number | null;
}


export interface SementeMes {
  ano: number;
  mes: number;
  rbt: number;
  folha: number;
}

export interface Tributos {
  irpj: number;
  csll: number;
  cofins: number;
  pis: number;
  cpp: number;
  icms: number;
  iss: number;
  ipi: number;
}

export interface DetalheAnexo {
  anexo: AnexoKey;
  anexoAplicado: string;
  faturamento: number;
  faixa: number | null;
  aliquotaEfetiva: number;
  tributos: Tributos;
  total: number;
  erro?: string;
}

export interface ResultadoMes {
  ano: number;
  mes: number;
  competencia: string;
  faturamentoTotal: number;
  folha: number;
  rbt12: number;
  folha12: number;
  fatorR: number;
  fatorRAtingido: boolean;
  anexos: DetalheAnexo[];
  simplesTributos: Tributos;
  simplesTotal: number;
  simplesAliquota: number;
  presumido: {
    baseComercio: number;
    baseServico: number;
    irpj: number;
    adicionalIrpj: number;
    csll: number;
    cofins: number;
    pis: number;
    iss: number;
    icms: number;
    ipi: number;
    inssProlabore: number;
    encargoPatronal: number;
    total: number;
    aliquota: number;
  };
  economia: number;
  avisos: string[];
}

const zeroTributos = (): Tributos => ({
  irpj: 0,
  csll: 0,
  cofins: 0,
  pis: 0,
  cpp: 0,
  icms: 0,
  iss: 0,
  ipi: 0,
});

const chave = (ano: number, mes: number) => `${ano}-${String(mes).padStart(2, "0")}`;

export const mesesAnteriores = (ano: number, mes: number, quantidade: number) => {
  const lista: { ano: number; mes: number }[] = [];
  let a = ano;
  let m = mes;
  for (let i = 0; i < quantidade; i++) {
    m -= 1;
    if (m === 0) {
      m = 12;
      a -= 1;
    }
    lista.push({ ano: a, mes: m });
  }
  return lista.reverse();
};

const num = (v: unknown) => (v === null || v === undefined ? 0 : Number(v));

function acharFaixa(faixas: FaixaSimples[], anexo: string, rbt12: number) {
  return (
    faixas.find(
      (f) =>
        f.anexo === anexo &&
        rbt12 >= num(f.receita_min) &&
        (f.receita_max === null || rbt12 <= num(f.receita_max)),
    ) ?? null
  );
}

function reducaoIcmsPr(tabela: FaixaIcmsPr[], tipo: "comercio" | "industria", rbt12: number) {
  const f = tabela.find(
    (r) =>
      r.tipo === tipo &&
      rbt12 >= num(r.receita_min) &&
      (r.receita_max === null || rbt12 <= num(r.receita_max)),
  );
  return f ? num(f.percentual_reducao) : 0;
}

/** Repartição da alíquota efetiva em alíquotas por tributo (em %). */
function repartir(faixa: FaixaSimples, aliquotaEfetiva: number): Tributos {
  const limite = faixa.limite_aliquota_efetiva_iss;
  const issFixo = faixa.iss_fixo_percentual;

  if (limite !== null && issFixo !== null && aliquotaEfetiva > num(limite)) {
    // Regra especial (Anexos III/IV, 5ª faixa): ISS travado e excedente
    // redistribuído entre os tributos federais pelos pesos da tabela.
    const excedente = aliquotaEfetiva - num(issFixo);
    const pesos = {
      irpj: num(faixa.peso_redist_irpj),
      csll: num(faixa.peso_redist_csll),
      cofins: num(faixa.peso_redist_cofins),
      pis: num(faixa.peso_redist_pis),
      cpp: num(faixa.peso_redist_cpp),
    };
    const soma = Object.values(pesos).reduce((a, b) => a + b, 0);
    const normal = soma > 0 ? soma : 1;
    return {
      irpj: (excedente * pesos.irpj) / normal,
      csll: (excedente * pesos.csll) / normal,
      cofins: (excedente * pesos.cofins) / normal,
      pis: (excedente * pesos.pis) / normal,
      cpp: (excedente * pesos.cpp) / normal,
      icms: 0,
      iss: num(issFixo),
      ipi: 0,
    };
  }

  return {
    irpj: (aliquotaEfetiva * num(faixa.rep_irpj)) / 100,
    csll: (aliquotaEfetiva * num(faixa.rep_csll)) / 100,
    cofins: (aliquotaEfetiva * num(faixa.rep_cofins)) / 100,
    pis: (aliquotaEfetiva * num(faixa.rep_pis)) / 100,
    cpp: (aliquotaEfetiva * num(faixa.rep_cpp)) / 100,
    icms: (aliquotaEfetiva * num(faixa.rep_icms)) / 100,
    iss: (aliquotaEfetiva * num(faixa.rep_iss)) / 100,
    ipi: (aliquotaEfetiva * num(faixa.rep_ipi)) / 100,
  };
}

export function calcularApuracao(input: {
  semente: SementeMes[];
  lancamentos: Lancamento[];
  parametros: ParametrosEmpresa;
  tabelaSimples: FaixaSimples[];
  tabelaIcmsPr: FaixaIcmsPr[];
}): ResultadoMes[] {
  const { semente, lancamentos, parametros, tabelaSimples, tabelaIcmsPr } = input;

  const historico = new Map<string, { rbt: number; folha: number }>();
  for (const s of semente) {
    historico.set(chave(s.ano, s.mes), { rbt: num(s.rbt), folha: num(s.folha) });
  }

  const ordenados = [...lancamentos].sort((a, b) => a.ano - b.ano || a.mes - b.mes);
  const resultados: ResultadoMes[] = [];

  for (const l of ordenados) {
    const faturamentos: Record<AnexoKey, number> = {
      I: num(l.fat_anexo_i),
      II: num(l.fat_anexo_ii),
      III: num(l.fat_anexo_iii),
      IV: num(l.fat_anexo_iv),
      V: num(l.fat_anexo_v),
    };
    const faturamentoTotal = Object.values(faturamentos).reduce((a, b) => a + b, 0);
    const folha = num(l.folha);

    const janela = mesesAnteriores(l.ano, l.mes, 12);
    let rbt12 = 0;
    let folha12 = 0;
    for (const j of janela) {
      const h = historico.get(chave(j.ano, j.mes));
      if (h) {
        rbt12 += h.rbt;
        folha12 += h.folha;
      }
    }

    const avisos: string[] = [];
    if (janela.some((j) => !historico.get(chave(j.ano, j.mes)))) {
      avisos.push("Histórico incompleto nos 12 meses anteriores — RBT12 pode estar subestimado.");
    }

    const fatorR = rbt12 > 0 ? folha12 / rbt12 : 0;
    const fatorRAtingido = fatorR >= 0.28;

    const detalhes: DetalheAnexo[] = [];
    const totalTributos = zeroTributos();

    (Object.keys(faturamentos) as AnexoKey[]).forEach((anexo) => {
      const faturamento = faturamentos[anexo];
      if (faturamento <= 0) return;
      const anexoAplicado = anexo === "V" && fatorRAtingido ? "III" : anexo;
      const faixa = acharFaixa(tabelaSimples, anexoAplicado, rbt12);

      if (!faixa || rbt12 <= 0) {
        detalhes.push({
          anexo,
          anexoAplicado,
          faturamento,
          faixa: null,
          aliquotaEfetiva: 0,
          tributos: zeroTributos(),
          total: 0,
          erro: !faixa
            ? `Faixa não encontrada para o Anexo ${anexoAplicado} (tabela não cadastrada).`
            : "RBT12 igual a zero.",
        });
        avisos.push(`Anexo ${anexoAplicado}: tabela do Simples Nacional não cadastrada.`);
        return;
      }

      const aliquotaEfetiva =
        ((rbt12 * (num(faixa.aliquota_nominal) / 100) - num(faixa.valor_deduzir)) / rbt12) * 100;

      const aliquotas = repartir(faixa, aliquotaEfetiva);

      if (anexoAplicado === "I" || anexoAplicado === "II") {
        const tipo = anexoAplicado === "I" ? "comercio" : "industria";
        const reducao = reducaoIcmsPr(tabelaIcmsPr, tipo, rbt12);
        aliquotas.icms = aliquotas.icms * (1 - reducao / 100);
      }

      const tributos: Tributos = {
        irpj: (faturamento * aliquotas.irpj) / 100,
        csll: (faturamento * aliquotas.csll) / 100,
        cofins: (faturamento * aliquotas.cofins) / 100,
        pis: (faturamento * aliquotas.pis) / 100,
        cpp: (faturamento * aliquotas.cpp) / 100,
        icms: (faturamento * aliquotas.icms) / 100,
        iss: (faturamento * aliquotas.iss) / 100,
        ipi: (faturamento * aliquotas.ipi) / 100,
      };
      const total = Object.values(tributos).reduce((a, b) => a + b, 0);

      (Object.keys(totalTributos) as (keyof Tributos)[]).forEach((k) => {
        totalTributos[k] += tributos[k];
      });

      detalhes.push({
        anexo,
        anexoAplicado,
        faturamento,
        faixa: faixa.faixa,
        aliquotaEfetiva,
        tributos,
        total,
      });
    });

    const simplesTotal = Object.values(totalTributos).reduce((a, b) => a + b, 0);

    // --- Lucro Presumido ---
    const receitaComercio = faturamentos.I + faturamentos.II;
    const receitaServico = faturamentos.III + faturamentos.IV + faturamentos.V;
    const baseComercio = (receitaComercio * num(parametros.perc_presuncao_comercio)) / 100;
    const baseServico = (receitaServico * num(parametros.perc_presuncao_servico)) / 100;
    const base = baseComercio + baseServico;

    const irpj = base * 0.15;
    const adicionalIrpj = Math.max(0, base - 20000) * 0.1;
    const csll = base * 0.09;
    const cofins = faturamentoTotal * 0.03;
    const pis = faturamentoTotal * 0.0065;
    const iss = (receitaServico * num(parametros.perc_iss)) / 100;
    const icms = (receitaComercio * num(parametros.perc_icms)) / 100;
    const ipi = (faturamentos.II * num(parametros.perc_ipi)) / 100;
    const inssProlabore = (num(parametros.prolabore_padrao) * num(parametros.perc_inss_prolabore)) / 100;
    const encargoPatronal = (folha * num(parametros.perc_encargo_patronal)) / 100;

    const presumidoTotal =
      irpj + adicionalIrpj + csll + cofins + pis + iss + icms + ipi + inssProlabore + encargoPatronal;

    resultados.push({
      ano: l.ano,
      mes: l.mes,
      competencia: `${String(l.mes).padStart(2, "0")}/${l.ano}`,
      faturamentoTotal,
      folha,
      rbt12,
      folha12,
      fatorR,
      fatorRAtingido,
      anexos: detalhes,
      simplesTributos: totalTributos,
      simplesTotal,
      simplesAliquota: faturamentoTotal > 0 ? (simplesTotal / faturamentoTotal) * 100 : 0,
      presumido: {
        baseComercio,
        baseServico,
        irpj,
        adicionalIrpj,
        csll,
        cofins,
        pis,
        iss,
        icms,
        ipi,
        inssProlabore,
        encargoPatronal,
        total: presumidoTotal,
        aliquota: faturamentoTotal > 0 ? (presumidoTotal / faturamentoTotal) * 100 : 0,
      },
      economia: presumidoTotal - simplesTotal,
      avisos: [...new Set(avisos)],
    });

    historico.set(chave(l.ano, l.mes), { rbt: faturamentoTotal, folha });
  }

  return resultados;
}
