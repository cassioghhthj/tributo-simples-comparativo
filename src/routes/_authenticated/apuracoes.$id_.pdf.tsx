import { useEffect, useState } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { supabase } from "@/integrations/supabase/client";
import { calcularApuracaoFn } from "@/lib/apuracao.functions";
import { brl, pct } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/apuracoes/$id_/pdf")({
  head: () => ({
    meta: [
      { title: "Relatório comparativo (PDF) | Martins & Ferri" },
      {
        name: "description",
        content:
          "Versão para impressão do relatório comparativo entre Simples Nacional e Lucro Presumido.",
      },
      { property: "og:title", content: "Relatório comparativo (PDF)" },
      {
        property: "og:description",
        content: "Resumo executivo e demonstrativo mês a mês para impressão em A4.",
      },
    ],
  }),
  component: RelatorioPdf,
});

/** Identidade do escritório — ajuste aqui endereço/contato e a logo. */
const ESCRITORIO = {
  nome: "Martins & Ferri Contabilidade",
  endereco: "Endereço do escritório — Cidade/UF · (00) 0000-0000 · contato@martinseferri.com.br",
  /** Troque por "/logo-martins-ferri.png" quando o arquivo estiver disponível. */
  logoSrc: null as string | null,
};

const NAVY = "#001358";
const GOLD = "#B18C00";
const BEGE = "#f7f5f0";
const BORDA = "#e7e4da";
const VERDE = "#0f4d3a";

function Lockup({ pequeno = false }: { pequeno?: boolean }) {
  if (ESCRITORIO.logoSrc) {
    return (
      <img
        src={ESCRITORIO.logoSrc}
        alt={ESCRITORIO.nome}
        style={{ height: pequeno ? 28 : 44, display: "block" }}
      />
    );
  }
  return (
    <div>
      <div
        style={{
          fontFamily: '"IBM Plex Serif", Georgia, serif',
          fontWeight: 700,
          color: NAVY,
          fontSize: pequeno ? 15 : 22,
          letterSpacing: "0.02em",
          lineHeight: 1.1,
        }}
      >
        MARTINS &amp; FERRI
      </div>
      <div
        style={{
          color: GOLD,
          fontSize: pequeno ? 7 : 9,
          letterSpacing: "0.38em",
          fontWeight: 600,
          marginTop: 2,
        }}
      >
        CONTABILIDADE
      </div>
    </div>
  );
}

function CampoBox({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div>
      <div style={{ fontSize: 7.5, letterSpacing: "0.14em", color: "#93a6d8", fontWeight: 600 }}>
        {rotulo.toUpperCase()}
      </div>
      <div style={{ fontSize: 11, fontWeight: 600, color: "#fff", marginTop: 2 }}>{valor || "—"}</div>
    </div>
  );
}

function Kpi({
  rotulo,
  valor,
  nota,
  destaque,
}: {
  rotulo: string;
  valor: string;
  nota?: string | undefined;
  destaque?: boolean | undefined;
}) {
  return (
    <div
      style={{
        flex: 1,
        border: `1px solid ${destaque ? VERDE : BORDA}`,
        background: destaque ? VERDE : "#fff",
        borderRadius: 6,
        padding: "10px 12px",
      }}
    >
      <div
        style={{
          fontSize: 7.5,
          letterSpacing: "0.12em",
          fontWeight: 600,
          color: destaque ? "rgba(255,255,255,0.75)" : "#7b7768",
        }}
      >
        {rotulo.toUpperCase()}
      </div>
      <div
        style={{
          fontSize: 15,
          fontWeight: 700,
          marginTop: 4,
          color: destaque ? "#fff" : NAVY,
        }}
      >
        {valor}
      </div>
      {nota && (
        <div
          style={{
            fontSize: 8,
            marginTop: 3,
            color: destaque ? "rgba(255,255,255,0.8)" : "#7b7768",
          }}
        >
          {nota}
        </div>
      )}
    </div>
  );
}

function Rodape({ pagina, empresa, cnpj }: { pagina: number; empresa: string; cnpj: string }) {
  return (
    <div
      style={{
        borderTop: `1px solid ${BORDA}`,
        paddingTop: 8,
        marginTop: "auto",
        fontSize: 7.5,
        color: "#8b8676",
        lineHeight: 1.5,
      }}
    >
      <div style={{ fontWeight: 600, color: NAVY }}>{ESCRITORIO.nome}</div>
      <div>{ESCRITORIO.endereco}</div>
      <div style={{ marginTop: 3 }}>
        Documento gerado pelo sistema de simulação tributária do escritório. Uso interno e orientativo;
        não substitui parecer jurídico ou contábil formal.
      </div>
      <div style={{ marginTop: 3 }}>
        Relatório Comparativo — Simples Nacional × Lucro Presumido · {empresa} · CNPJ {cnpj} · Página{" "}
        {pagina}
      </div>
    </div>
  );
}

function RelatorioPdf() {
  const { id } = Route.useParams();
  const router = useRouter();
  const [pronto, setPronto] = useState(false);

  const base = useQuery({
    queryKey: ["apuracao-pdf", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("apuracoes")
        .select(
          "id, ano_inicial, mes_inicial, ano_tabela, descricao, observacoes, empresas(nome, cnpj, atividade, anexo_predominante)",
        )
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const calculo = useQuery({
    queryKey: ["apuracao-calculo", id],
    queryFn: () => calcularApuracaoFn({ data: { apuracaoId: id } }),
  });

  const resultados = calculo.data?.resultados ?? [];
  const carregando = base.isLoading || calculo.isLoading;

  useEffect(() => {
    if (carregando || pronto) return;
    setPronto(true);
    const t = setTimeout(() => window.print(), 900);
    return () => clearTimeout(t);
  }, [carregando, pronto]);

  if (carregando) return <p style={{ padding: 24 }}>Preparando relatório…</p>;

  const empresa = (base.data?.empresas ?? null) as {
    nome: string;
    cnpj: string | null;
    atividade: string | null;
    anexo_predominante: string;
  } | null;

  const acumulado = resultados.reduce(
    (acc, r) => ({
      faturamento: acc.faturamento + r.faturamentoTotal,
      simples: acc.simples + r.simplesTotal,
      presumido: acc.presumido + r.presumido.total,
    }),
    { faturamento: 0, simples: 0, presumido: 0 },
  );

  const simplesMelhor = acumulado.simples <= acumulado.presumido;
  const diferenca = Math.abs(acumulado.presumido - acumulado.simples);
  const meses = resultados.length || 1;
  const fatores = resultados.map((r) => r.fatorR * 100);
  const fatorMin = fatores.length ? Math.min(...fatores) : 0;
  const fatorMax = fatores.length ? Math.max(...fatores) : 0;
  const cruzou = resultados.filter((r) => r.fatorRAtingido);

  const periodo = resultados.length
    ? `${resultados[0]!.competencia} a ${resultados[resultados.length - 1]!.competencia}`
    : `${String(base.data?.mes_inicial).padStart(2, "0")}/${base.data?.ano_inicial}`;

  const geradoEm = new Date().toLocaleString("pt-BR", { dateStyle: "long", timeStyle: "short" });
  const cnpj = empresa?.cnpj || "—";
  const nomeEmpresa = empresa?.nome ?? "—";
  const observacoes = (base.data?.observacoes ?? "").trim();

  const veredito = `No período simulado (${periodo}, ${resultados.length} competência(s)), o regime ${
    simplesMelhor ? "Simples Nacional" : "Lucro Presumido"
  } apresenta a menor carga tributária: ${brl(simplesMelhor ? acumulado.simples : acumulado.presumido)} contra ${brl(
    simplesMelhor ? acumulado.presumido : acumulado.simples,
  )} do ${simplesMelhor ? "Lucro Presumido" : "Simples Nacional"}, uma economia de ${brl(diferenca)} no período (média de ${brl(
    diferenca / meses,
  )} por mês). O Fator R oscilou entre ${pct(fatorMin)} e ${pct(fatorMax)}${
    cruzou.length
      ? `, ultrapassando 28% em ${cruzou.length} mês(es) — a partir de ${cruzou[0]!.competencia} a receita do Anexo V passa a ser tributada pelas alíquotas do Anexo III.`
      : ", sem ultrapassar 28% em nenhum mês do período, de modo que a receita do Anexo V manteve suas próprias alíquotas."
  }`;

  const dadosGrafico = resultados.map((r) => ({
    competencia: r.competencia,
    "Simples Nacional": Number(r.simplesTotal.toFixed(2)),
    "Lucro Presumido": Number(r.presumido.total.toFixed(2)),
    "Alíq. SN": Number(r.simplesAliquota.toFixed(2)),
    "Alíq. LP": Number(r.presumido.aliquota.toFixed(2)),
  }));

  const anexosDoMes = (r: (typeof resultados)[number]) =>
    r.anexos
      .filter((a) => a.faturamento > 0)
      .map((a) => (a.anexo === "V" && r.fatorRAtingido ? "V → III" : a.anexo))
      .join(", ") || "—";

  return (
    <>
      <style>{`
        @page { size: A4; margin: 0; }
        @media print {
          html, body { background: #fff !important; }
          body > div > header, [data-sonner-toaster] { display: none !important; }
          main { max-width: none !important; padding: 0 !important; margin: 0 !important; }
          .no-print { display: none !important; }
          .pdf-page { box-shadow: none !important; margin: 0 !important; }
        }
        .pdf-page {
          width: 210mm;
          min-height: 297mm;
          padding: 12mm 13mm;
          background: ${BEGE};
          color: #22201a;
          font-family: "IBM Plex Sans", system-ui, sans-serif;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          margin: 0 auto 8mm;
          box-shadow: 0 2px 14px rgba(0,0,0,0.12);
          page-break-after: always;
          break-after: page;
        }
        .pdf-page:last-child { page-break-after: auto; break-after: auto; }
        .pdf-card { background:#fff; border:1px solid ${BORDA}; border-radius:6px; }
        .pdf-tbl { width:100%; border-collapse: collapse; font-size: 8.5px; }
        .pdf-tbl th { background:${NAVY}; color:#fff; font-weight:600; padding:6px 5px; text-align:right; }
        .pdf-tbl th:first-child, .pdf-tbl th.l { text-align:left; }
        .pdf-tbl td { padding:5px; text-align:right; border-bottom:1px solid ${BORDA}; }
        .pdf-tbl td.l { text-align:left; }
        .pdf-tbl tbody tr:nth-child(even) { background:#faf9f5; }
      `}</style>

      <div className="no-print" style={{ display: "flex", gap: 8, padding: "12px 0" }}>
        <button
          onClick={() => window.print()}
          style={{
            background: NAVY,
            color: "#fff",
            border: 0,
            borderRadius: 6,
            padding: "8px 16px",
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          Imprimir / Salvar em PDF
        </button>
        <button
          onClick={() => router.navigate({ to: "/apuracoes/$id", params: { id } })}
          style={{
            background: "#fff",
            color: NAVY,
            border: `1px solid ${BORDA}`,
            borderRadius: 6,
            padding: "8px 16px",
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          Voltar
        </button>
      </div>

      {/* ---------------- Página 1 ---------------- */}
      <section className="pdf-page">
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            borderBottom: `2px solid ${GOLD}`,
            paddingBottom: 8,
          }}
        >
          <Lockup />
          <div style={{ textAlign: "right", fontSize: 8, color: "#8b8676", lineHeight: 1.5 }}>
            <div>Relatório gerado em {geradoEm}</div>
            <div>Sistema de Simulação Tributária · Martins &amp; Ferri</div>
          </div>
        </header>

        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 8, letterSpacing: "0.2em", color: GOLD, fontWeight: 700 }}>
            RELATÓRIO COMPARATIVO
          </div>
          <h1
            style={{
              fontFamily: '"IBM Plex Serif", Georgia, serif',
              fontSize: 26,
              color: NAVY,
              margin: "4px 0 2px",
              fontWeight: 700,
            }}
          >
            Simples Nacional × Lucro Presumido
          </h1>
          <p style={{ fontSize: 9.5, color: "#7b7768", margin: 0 }}>
            Simulação de carga tributária mês a mês com base nos faturamentos e folha informados ·
            tabelas vigentes {base.data?.ano_tabela}
          </p>
        </div>

        <div
          style={{
            background: NAVY,
            borderRadius: 6,
            padding: "12px 14px",
            marginTop: 12,
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "10px 16px",
          }}
        >
          <CampoBox rotulo="Empresa" valor={nomeEmpresa} />
          <CampoBox rotulo="CNPJ" valor={cnpj} />
          <CampoBox rotulo="Município / UF" valor="— / PR" />
          <CampoBox rotulo="Atividade" valor={empresa?.atividade ?? "—"} />
          <CampoBox
            rotulo="Regime atual"
            valor={`Simples Nacional — Anexo ${empresa?.anexo_predominante ?? "—"}`}
          />
          <CampoBox rotulo="Período simulado" valor={periodo} />
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <Kpi rotulo="Faturamento acumulado" valor={brl(acumulado.faturamento)} nota={`${resultados.length} competência(s)`} />
          <Kpi
            rotulo="Simples Nacional"
            valor={brl(acumulado.simples)}
            nota={
              acumulado.faturamento > 0
                ? `Carga efetiva ${pct((acumulado.simples / acumulado.faturamento) * 100)}`
                : undefined
            }
            destaque={simplesMelhor}
          />
          <Kpi
            rotulo="Lucro Presumido"
            valor={brl(acumulado.presumido)}
            nota={
              acumulado.faturamento > 0
                ? `Carga efetiva ${pct((acumulado.presumido / acumulado.faturamento) * 100)}`
                : undefined
            }
            destaque={!simplesMelhor}
          />
          <Kpi
            rotulo="Diferença no período"
            valor={brl(diferenca)}
            nota={`Economia com o ${simplesMelhor ? "Simples Nacional" : "Lucro Presumido"}`}
          />
        </div>

        <div
          style={{
            background: "#eaf4ec",
            borderLeft: "4px solid #2f8a4e",
            borderRadius: 4,
            padding: "10px 12px",
            marginTop: 12,
          }}
        >
          <span
            style={{
              background: "#2f8a4e",
              color: "#fff",
              fontSize: 7.5,
              fontWeight: 700,
              letterSpacing: "0.14em",
              padding: "2px 7px",
              borderRadius: 3,
            }}
          >
            VEREDITO
          </span>
          <p style={{ fontSize: 9.5, lineHeight: 1.6, margin: "7px 0 0", color: "#1f3a29" }}>
            {veredito}
          </p>
        </div>

        <div className="pdf-card" style={{ marginTop: 12, padding: "10px 12px" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: NAVY, marginBottom: 4 }}>
            Comparativo de carga tributária
          </div>
          <ComposedChart
            width={650}
            height={210}
            data={dadosGrafico}
            margin={{ top: 8, right: 6, bottom: 0, left: 6 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={BORDA} />
            <XAxis dataKey="competencia" fontSize={8} stroke="#8b8676" />
            <YAxis yAxisId="left" fontSize={8} stroke="#8b8676" width={62} />
            <YAxis yAxisId="right" orientation="right" fontSize={8} stroke="#8b8676" unit="%" width={34} />
            <Tooltip formatter={(v: number, n: string) => (n.startsWith("Alíq") ? pct(v) : brl(v))} />
            <Legend wrapperStyle={{ fontSize: 8 }} />
            <Bar yAxisId="left" dataKey="Simples Nacional" fill={NAVY} isAnimationActive={false} />
            <Bar yAxisId="left" dataKey="Lucro Presumido" fill={GOLD} isAnimationActive={false} />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="Alíq. SN"
              stroke={NAVY}
              strokeDasharray="4 3"
              strokeWidth={1.6}
              dot={false}
              isAnimationActive={false}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="Alíq. LP"
              stroke={GOLD}
              strokeDasharray="4 3"
              strokeWidth={1.6}
              dot={false}
              isAnimationActive={false}
            />
          </ComposedChart>
        </div>

        {observacoes && (
          <div
            style={{
              background: "#fffdf6",
              border: `1px dashed ${GOLD}`,
              borderRadius: 6,
              padding: "10px 12px",
              marginTop: 12,
            }}
          >
            <div style={{ fontSize: 8, letterSpacing: "0.14em", color: GOLD, fontWeight: 700 }}>
              OBSERVAÇÕES DO CONTADOR
            </div>
            <p style={{ fontSize: 9.5, lineHeight: 1.6, margin: "6px 0 0", whiteSpace: "pre-wrap" }}>
              {observacoes}
            </p>
          </div>
        )}

        <div style={{ height: 12 }} />
        <Rodape pagina={1} empresa={nomeEmpresa} cnpj={cnpj} />
      </section>

      {/* ---------------- Página 2 ---------------- */}
      <section className="pdf-page">
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            borderBottom: `2px solid ${GOLD}`,
            paddingBottom: 8,
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-end", gap: 14 }}>
            <Lockup pequeno />
            <span style={{ fontSize: 12, fontWeight: 600, color: NAVY }}>Demonstrativo mês a mês</span>
          </div>
          <div style={{ textAlign: "right", fontSize: 8, color: "#8b8676", lineHeight: 1.5 }}>
            <div style={{ fontWeight: 600, color: NAVY }}>{nomeEmpresa}</div>
            <div>CNPJ {cnpj}</div>
          </div>
        </header>

        <div className="pdf-card" style={{ marginTop: 12, overflow: "hidden" }}>
          <table className="pdf-tbl">
            <thead>
              <tr>
                <th className="l">Competência</th>
                <th>Faturamento</th>
                <th>RBT12</th>
                <th>Fator R</th>
                <th>Simples</th>
                <th className="l">Anexo</th>
                <th>Alíq. SN</th>
                <th>Presumido</th>
                <th>Alíq. LP</th>
                <th>Diferença</th>
              </tr>
            </thead>
            <tbody>
              {resultados.map((r) => (
                <tr key={r.competencia}>
                  <td className="l">{r.competencia}</td>
                  <td>{brl(r.faturamentoTotal)}</td>
                  <td>{brl(r.rbt12)}</td>
                  <td>{pct(r.fatorR * 100)}</td>
                  <td>{brl(r.simplesTotal)}</td>
                  <td className="l" style={{ whiteSpace: "nowrap" }}>
                    {anexosDoMes(r)}
                  </td>
                  <td>{pct(r.simplesAliquota)}</td>
                  <td>{brl(r.presumido.total)}</td>
                  <td>{pct(r.presumido.aliquota)}</td>
                  <td style={{ fontWeight: 600, color: r.economia >= 0 ? "#1f7a4c" : "#a32020" }}>
                    {brl(r.economia)}
                  </td>
                </tr>
              ))}
              {resultados.length === 0 && (
                <tr>
                  <td className="l" colSpan={10}>
                    Sem lançamentos registrados.
                  </td>
                </tr>
              )}
            </tbody>
            {resultados.length > 0 && (
              <tfoot>
                <tr style={{ background: "#eef1f8", fontWeight: 700, color: NAVY }}>
                  <td className="l" style={{ padding: "7px 5px" }}>
                    Acumulado
                  </td>
                  <td>{brl(acumulado.faturamento)}</td>
                  <td />
                  <td />
                  <td>{brl(acumulado.simples)}</td>
                  <td />
                  <td>
                    {pct(acumulado.faturamento > 0 ? (acumulado.simples / acumulado.faturamento) * 100 : 0)}
                  </td>
                  <td>{brl(acumulado.presumido)}</td>
                  <td>
                    {pct(
                      acumulado.faturamento > 0 ? (acumulado.presumido / acumulado.faturamento) * 100 : 0,
                    )}
                  </td>
                  <td>{brl(acumulado.presumido - acumulado.simples)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        <p style={{ fontSize: 7.5, color: "#8b8676", lineHeight: 1.6, marginTop: 8 }}>
          RBT12: receita bruta acumulada dos 12 meses anteriores à competência, base para a alíquota
          efetiva do Simples Nacional. Fator R: razão entre a folha dos 12 meses anteriores e o RBT12 —
          quando igual ou superior a 28%, a receita do Anexo V é tributada pelas alíquotas do Anexo III
          (indicado como "V → III"). Diferença: Lucro Presumido menos Simples Nacional; valores positivos
          indicam economia com o Simples Nacional.
        </p>

        <div style={{ height: 12 }} />
        <Rodape pagina={2} empresa={nomeEmpresa} cnpj={cnpj} />
      </section>
    </>
  );
}
