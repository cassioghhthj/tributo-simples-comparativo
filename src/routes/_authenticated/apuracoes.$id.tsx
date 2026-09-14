import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { supabase } from "@/integrations/supabase/client";
import { calcularApuracaoFn } from "@/lib/apuracao.functions";
import { mesesAnteriores } from "@/lib/calculo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { MemoriaCalculo } from "@/components/MemoriaCalculo";
import { EditarSemente } from "@/components/EditarSemente";
import { MESES, brl, pct } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/apuracoes/$id")({
  head: () => ({
    meta: [
      { title: "Apuração | Simulador Tributário Martins & Ferri" },
      {
        name: "description",
        content:
          "Lançamento mensal por anexo e relatório comparativo entre Simples Nacional e Lucro Presumido.",
      },
      { property: "og:title", content: "Apuração | Simulador Tributário" },
      {
        property: "og:description",
        content: "RBT12, Fator R, carga tributária mês a mês e comparativo acumulado.",
      },
    ],
  }),
  component: ApuracaoPagina,
});

const CAMPOS = [
  { key: "fat_anexo_i", label: "Anexo I — Comércio", ajuda: undefined },
  { key: "fat_anexo_ii", label: "Anexo II — Indústria", ajuda: undefined },
  { key: "fat_anexo_iii", label: "Anexo III — Serviço", ajuda: undefined },
  { key: "fat_anexo_iv", label: "Anexo IV — Serviço", ajuda: undefined },
  {
    key: "fat_anexo_v",
    label: "Anexo V — Serviço (Fator R)",
    ajuda: "Se o Fator R do mês for ≥28%, esta receita é tributada automaticamente pelas alíquotas do Anexo III.",
  },
] as const;

const ISENCOES = [
  { key: "isento_icms", label: "Receita isenta de ICMS", nota: "Abate a base dos Anexos I e II" },
  { key: "isento_iss", label: "Receita isenta de ISS", nota: "Abate a base dos Anexos III, IV e V" },
  {
    key: "isento_pis_cofins",
    label: "Receita isenta de PIS/COFINS",
    nota: "Abate a base de todos os anexos",
  },
  { key: "isento_ipi", label: "Receita isenta de IPI", nota: "Abate a base do Anexo II" },
] as const;

type CampoKey = (typeof CAMPOS)[number]["key"];
type IsencaoKey = (typeof ISENCOES)[number]["key"];
type Form = Record<CampoKey | IsencaoKey | "folha", string>;

const formVazio: Form = {
  fat_anexo_i: "",
  fat_anexo_ii: "",
  fat_anexo_iii: "",
  fat_anexo_iv: "",
  fat_anexo_v: "",
  folha: "",
  isento_icms: "",
  isento_iss: "",
  isento_pis_cofins: "",
  isento_ipi: "",
};


function ApuracaoPagina() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const base = useQuery({
    queryKey: ["apuracao-base", id],
    queryFn: async () => {
      const [apuracao, semente, lancamentos] = await Promise.all([
        supabase
          .from("apuracoes")
          .select("id, ano_inicial, mes_inicial, ano_tabela, descricao, empresas(nome, cnpj)")
          .eq("id", id)
          .single(),
        supabase.from("apuracao_semente").select("ano, mes, rbt, folha").eq("apuracao_id", id),
        supabase.from("lancamentos_mensais").select("*").eq("apuracao_id", id).order("ano").order("mes"),
      ]);
      if (apuracao.error) throw apuracao.error;
      return {
        apuracao: apuracao.data,
        semente: semente.data ?? [],
        lancamentos: lancamentos.data ?? [],
      };
    },
  });

  const calculo = useQuery({
    queryKey: ["apuracao-calculo", id, base.data?.lancamentos.length],
    queryFn: () => calcularApuracaoFn({ data: { apuracaoId: id } }),
    enabled: !!base.data,
  });

  const proxima = useMemo(() => {
    if (!base.data) return { ano: new Date().getFullYear(), mes: 1 };
    const l = base.data.lancamentos;
    if (l.length === 0)
      return { ano: base.data.apuracao.ano_inicial, mes: base.data.apuracao.mes_inicial };
    const ultimo = l[l.length - 1]!;
    return ultimo.mes === 12 ? { ano: ultimo.ano + 1, mes: 1 } : { ano: ultimo.ano, mes: ultimo.mes + 1 };
  }, [base.data]);

  const [comp, setComp] = useState<{ ano: string; mes: string } | null>(null);
  const [form, setForm] = useState<Form>(formVazio);
  const [isencoesAbertas, setIsencoesAbertas] = useState(false);
  const [expandido, setExpandido] = useState<string | null>(null);
  const [sugestaoDe, setSugestaoDe] = useState<string | null>(null);
  const [camposSugeridos, setCamposSugeridos] = useState<string[]>([]);
  const prefillRef = useRef<string | null>(null);

  const ultimoLancamento = base.data?.lancamentos.at(-1) ?? null;
  const apuracaoCompleta = (base.data?.lancamentos.length ?? 0) >= 12;


  const atualizarCampo = (key: keyof Form, valor: string) => {
    setForm((f) => ({ ...f, [key]: valor }));
    setCamposSugeridos((s) => s.filter((k) => k !== key));
  };

  const limparSugestao = () => {
    setForm(formVazio);
    setCamposSugeridos([]);
    setSugestaoDe(null);
  };

  // Pré-preenche o formulário com o último lançamento salvo (apenas sugestão, nada é salvo).
  useEffect(() => {
    if (!ultimoLancamento) return;
    const marca = `${id}-${ultimoLancamento.id}-${ultimoLancamento.ano}-${ultimoLancamento.mes}`;
    if (prefillRef.current === marca) return;
    prefillRef.current = marca;

    const num = (v: unknown) => (Number(v) ? String(Number(v)) : "");
    const novo: Form = {
      fat_anexo_i: num(ultimoLancamento.fat_anexo_i),
      fat_anexo_ii: num(ultimoLancamento.fat_anexo_ii),
      fat_anexo_iii: num(ultimoLancamento.fat_anexo_iii),
      fat_anexo_iv: num(ultimoLancamento.fat_anexo_iv),
      fat_anexo_v: num(ultimoLancamento.fat_anexo_v),
      folha: num(ultimoLancamento.folha),
      isento_icms: num(ultimoLancamento.isento_icms),
      isento_iss: num(ultimoLancamento.isento_iss),
      isento_pis_cofins: num(ultimoLancamento.isento_pis_cofins),
      isento_ipi: num(ultimoLancamento.isento_ipi),
    };
    const preenchidos = (Object.keys(novo) as (keyof Form)[]).filter((k) => novo[k] !== "");
    if (preenchidos.length === 0) return;
    setForm(novo);
    setCamposSugeridos(preenchidos as string[]);
    setSugestaoDe(`${String(ultimoLancamento.mes).padStart(2, "0")}/${ultimoLancamento.ano}`);
    if (ISENCOES.some((c) => novo[c.key] !== "")) setIsencoesAbertas(true);
  }, [id, ultimoLancamento]);

  const compAtual = comp ?? { ano: String(proxima.ano), mes: String(proxima.mes) };
  const classeSugerido = (key: keyof Form) =>
    camposSugeridos.includes(key) ? " border-warning/70 bg-warning/5" : "";


  const previa = useMemo(() => {
    if (!base.data) return { rbt12: 0, folha12: 0, fatorR: 0, faltando: 0 };
    const mapa = new Map<string, { rbt: number; folha: number }>();
    for (const s of base.data.semente) {
      mapa.set(`${s.ano}-${s.mes}`, { rbt: Number(s.rbt), folha: Number(s.folha) });
    }
    for (const l of base.data.lancamentos) {
      const total =
        Number(l.fat_anexo_i) +
        Number(l.fat_anexo_ii) +
        Number(l.fat_anexo_iii) +
        Number(l.fat_anexo_iv) +
        Number(l.fat_anexo_v);
      mapa.set(`${l.ano}-${l.mes}`, { rbt: total, folha: Number(l.folha) });
    }
    const janela = mesesAnteriores(Number(compAtual.ano), Number(compAtual.mes), 12);
    let rbt12 = 0;
    let folha12 = 0;
    let faltando = 0;
    for (const j of janela) {
      const h = mapa.get(`${j.ano}-${j.mes}`);
      if (!h) {
        faltando += 1;
        continue;
      }
      rbt12 += h.rbt;
      folha12 += h.folha;
    }
    return { rbt12, folha12, fatorR: rbt12 > 0 ? folha12 / rbt12 : 0, faltando };
  }, [base.data, compAtual.ano, compAtual.mes]);

  const totalDigitado = CAMPOS.reduce((acc, c) => acc + (Number(form[c.key]) || 0), 0);
  const totalIsencoes = ISENCOES.reduce((acc, c) => acc + (Number(form[c.key]) || 0), 0);

  const salvar = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("lancamentos_mensais").upsert(
        {
          apuracao_id: id,
          ano: Number(compAtual.ano),
          mes: Number(compAtual.mes),
          fat_anexo_i: Number(form.fat_anexo_i) || 0,
          fat_anexo_ii: Number(form.fat_anexo_ii) || 0,
          fat_anexo_iii: Number(form.fat_anexo_iii) || 0,
          fat_anexo_iv: Number(form.fat_anexo_iv) || 0,
          fat_anexo_v: Number(form.fat_anexo_v) || 0,
          folha: Number(form.folha) || 0,
          isento_icms: Number(form.isento_icms) || 0,
          isento_iss: Number(form.isento_iss) || 0,
          isento_pis_cofins: Number(form.isento_pis_cofins) || 0,
          isento_ipi: Number(form.isento_ipi) || 0,

        },
        { onConflict: "apuracao_id,ano,mes" },
      );
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Lançamento salvo.");
      setForm(formVazio);
      setComp(null);
      await qc.invalidateQueries({ queryKey: ["apuracao-base", id] });
      await qc.invalidateQueries({ queryKey: ["apuracao-calculo", id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const excluir = useMutation({
    mutationFn: async (lancamentoId: string) => {
      const { error } = await supabase.from("lancamentos_mensais").delete().eq("id", lancamentoId);
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Lançamento excluído.");
      await qc.invalidateQueries({ queryKey: ["apuracao-base", id] });
      await qc.invalidateQueries({ queryKey: ["apuracao-calculo", id] });
    },
  });

  const resultados = calculo.data?.resultados ?? [];
  const acumulado = resultados.reduce(
    (acc, r) => ({
      faturamento: acc.faturamento + r.faturamentoTotal,
      simples: acc.simples + r.simplesTotal,
      presumido: acc.presumido + r.presumido.total,
    }),
    { faturamento: 0, simples: 0, presumido: 0 },
  );

  const empresa = base.data?.apuracao.empresas as { nome: string; cnpj: string | null } | null;

  if (base.isLoading) return <p className="text-sm text-muted-foreground">Carregando…</p>;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">{empresa?.nome}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {base.data?.apuracao.descricao || "Apuração"} · início em{" "}
            {String(base.data?.apuracao.mes_inicial).padStart(2, "0")}/{base.data?.apuracao.ano_inicial} ·
            tabela {base.data?.apuracao.ano_tabela}
          </p>
        </div>
        <Badge variant={acumulado.simples <= acumulado.presumido ? "default" : "destructive"}>
          {acumulado.simples <= acumulado.presumido
            ? "Simples Nacional mais vantajoso"
            : "Lucro Presumido mais vantajoso"}
        </Badge>
      </header>

      {calculo.data && calculo.data.tabelasCarregadas.simples === 0 && (
        <Card className="border-warning/50">
          <CardContent className="py-4 text-sm">
            A tabela do Simples Nacional para o ano {base.data?.apuracao.ano_tabela} ainda não foi
            populada. Os lançamentos são salvos normalmente, mas os tributos do Simples ficarão zerados
            até o cadastro das faixas.
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="lancamento">
        <TabsList>
          <TabsTrigger value="lancamento">Lançamento mensal</TabsTrigger>
          <TabsTrigger value="relatorio">Relatório comparativo</TabsTrigger>
        </TabsList>

        <TabsContent value="lancamento" className="space-y-6 pt-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Base do RBT12: 12 meses anteriores a{" "}
              <span className="num">
                {String(base.data?.apuracao.mes_inicial).padStart(2, "0")}/
                {base.data?.apuracao.ano_inicial}
              </span>
            </p>
            {base.data && (
              <EditarSemente
                apuracaoId={id}
                anoInicial={base.data.apuracao.ano_inicial}
                mesInicial={base.data.apuracao.mes_inicial}
                semente={base.data.semente}
                totalLancamentos={base.data.lancamentos.length}
              />
            )}
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <Indicador titulo="RBT12 (12 meses anteriores)" valor={brl(previa.rbt12)} />
            <Indicador titulo="Folha 12 meses" valor={brl(previa.folha12)} />
            <Indicador
              titulo="Fator R"
              valor={pct(previa.fatorR * 100)}
              nota={
                previa.fatorR >= 0.28
                  ? "≥ 28% — Anexo V tributado pelo Anexo III"
                  : "< 28% — Anexo V mantém suas alíquotas"
              }
            />
          </div>

          {apuracaoCompleta ? (
            <Card>
              <CardHeader>
                <CardTitle>Apuração completa</CardTitle>
                <CardDescription>
                  Esta apuração já tem os 12 meses completos. Para lançar outra competência, exclua um
                  lançamento existente ou crie uma nova apuração.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
          <Card>
            <CardHeader>
              <CardTitle>Novo lançamento</CardTitle>
              <CardDescription>
                Informe apenas o faturamento por anexo e a folha do mês. O total é calculado
                automaticamente.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">

              {sugestaoDe && camposSugeridos.length > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-warning/50 bg-warning/5 px-4 py-3 text-sm">
                  <span>
                    Valores pré-preenchidos com o lançamento de{" "}
                    <strong className="num">{sugestaoDe}</strong> — confira e edite antes de salvar. Nada
                    é salvo automaticamente.
                  </span>
                  <Button type="button" variant="ghost" size="sm" onClick={limparSugestao}>
                    Limpar campos
                  </Button>
                </div>
              )}
              <div className="grid gap-4 md:grid-cols-4">

                <div className="space-y-2">
                  <Label>Mês</Label>
                  <Select
                    value={compAtual.mes}
                    onValueChange={(v) => setComp({ ano: compAtual.ano, mes: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MESES.map((m, i) => (
                        <SelectItem key={m} value={String(i + 1)}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ano">Ano</Label>
                  <Input
                    id="ano"
                    type="number"
                    className="num"
                    value={compAtual.ano}
                    onChange={(e) => setComp({ ano: e.target.value, mes: compAtual.mes })}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {CAMPOS.map((c) => (
                  <div key={c.key} className="space-y-2">
                    <Label htmlFor={c.key}>{c.label}</Label>
                    <Input
                      id={c.key}
                      type="number"
                      step="0.01"
                      className={"num" + classeSugerido(c.key)}
                      value={form[c.key]}
                      onChange={(e) => atualizarCampo(c.key, e.target.value)}
                    />
                    {c.ajuda && (
                      <p className="text-xs text-muted-foreground leading-snug">{c.ajuda}</p>
                    )}
                  </div>
                ))}
                <div className="space-y-2">
                  <Label htmlFor="folha">Folha de pagamento do mês</Label>
                  <Input
                    id="folha"
                    type="number"
                    step="0.01"
                    className={"num" + classeSugerido("folha")}
                    value={form.folha}
                    onChange={(e) => atualizarCampo("folha", e.target.value)}
                  />
                </div>

              </div>

              <Collapsible open={isencoesAbertas} onOpenChange={setIsencoesAbertas}>
                <CollapsibleTrigger asChild>
                  <Button type="button" variant="ghost" size="sm" className="px-0">
                    {isencoesAbertas ? "▾" : "▸"} Isenções (opcional)
                    {totalIsencoes > 0 && (
                      <span className="num ml-2 text-muted-foreground">{brl(totalIsencoes)}</span>
                    )}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-3">
                  <p className="mb-3 text-sm text-muted-foreground">
                    Parcela da receita do mês isenta de cada tributo dentro do Simples Nacional
                    (substituição tributária, monofásico, exportação etc.). A base de cálculo do tributo é
                    reduzida no valor informado, nunca abaixo de zero.
                  </p>
                  <div className="grid gap-4 md:grid-cols-4">
                    {ISENCOES.map((c) => (
                      <div key={c.key} className="space-y-2">
                        <Label htmlFor={c.key}>{c.label}</Label>
                        <Input
                          id={c.key}
                          type="number"
                          step="0.01"
                          className={"num" + classeSugerido(c.key)}
                          value={form[c.key]}
                          onChange={(e) => atualizarCampo(c.key, e.target.value)}
                        />

                        <p className="text-xs text-muted-foreground">{c.nota}</p>
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>



              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                <p className="text-sm text-muted-foreground">
                  Faturamento total do mês:{" "}
                  <span className="num font-semibold text-foreground">{brl(totalDigitado)}</span>
                </p>
                <Button onClick={() => salvar.mutate()} disabled={salvar.isPending}>
                  {salvar.isPending ? "Salvando…" : "Salvar lançamento"}
                </Button>
              </div>
              {previa.faltando > 0 && (
                <p className="text-xs text-warning">
                  Atenção: {previa.faltando} mês(es) da janela de 12 meses sem dados — o RBT12 pode estar
                  incompleto.
                </p>
              )}
            </CardContent>
          </Card>
          )}


          <Card>
            <CardHeader>
              <CardTitle>Lançamentos registrados</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-muted-foreground">
                      <th className="px-6 py-2 font-medium">Competência</th>
                      <th className="px-3 py-2 text-right font-medium">Anexo I</th>
                      <th className="px-3 py-2 text-right font-medium">Anexo II</th>
                      <th className="px-3 py-2 text-right font-medium">Anexo III</th>
                      <th className="px-3 py-2 text-right font-medium">Anexo IV</th>
                      <th className="px-3 py-2 text-right font-medium">Anexo V</th>
                      <th className="px-3 py-2 text-right font-medium">Folha</th>
                      <th className="px-6 py-2" />
                    </tr>
                  </thead>
                  <tbody className="num">
                    {base.data?.lancamentos.map((l) => (
                      <tr key={l.id} className="border-b border-border/60">
                        <td className="px-6 py-2">
                          {String(l.mes).padStart(2, "0")}/{l.ano}
                        </td>
                        <td className="px-3 py-2 text-right">{brl(Number(l.fat_anexo_i))}</td>
                        <td className="px-3 py-2 text-right">{brl(Number(l.fat_anexo_ii))}</td>
                        <td className="px-3 py-2 text-right">{brl(Number(l.fat_anexo_iii))}</td>
                        <td className="px-3 py-2 text-right">{brl(Number(l.fat_anexo_iv))}</td>
                        <td className="px-3 py-2 text-right">{brl(Number(l.fat_anexo_v))}</td>
                        <td className="px-3 py-2 text-right">{brl(Number(l.folha))}</td>
                        <td className="px-6 py-2 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => excluir.mutate(l.id)}
                            className="text-destructive"
                          >
                            Excluir
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {base.data?.lancamentos.length === 0 && (
                      <tr>
                        <td colSpan={8} className="px-6 py-6 text-muted-foreground">
                          Nenhum lançamento registrado.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="relatorio" className="space-y-6 pt-4">
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => navigate({ to: "/apuracoes/$id/pdf", params: { id } })}>
              Exportar PDF
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            <Indicador titulo="Faturamento acumulado" valor={brl(acumulado.faturamento)} />
            <Indicador
              titulo="Simples Nacional acumulado"
              valor={brl(acumulado.simples)}
              nota={
                acumulado.faturamento > 0
                  ? `Carga efetiva ${pct((acumulado.simples / acumulado.faturamento) * 100)}`
                  : undefined
              }
            />
            <Indicador
              titulo="Lucro Presumido acumulado"
              valor={brl(acumulado.presumido)}
              nota={
                acumulado.faturamento > 0
                  ? `Carga efetiva ${pct((acumulado.presumido / acumulado.faturamento) * 100)}`
                  : undefined
              }
            />
            <Indicador
              titulo="Diferença no período"
              valor={brl(Math.abs(acumulado.presumido - acumulado.simples))}
              nota={
                acumulado.presumido >= acumulado.simples
                  ? "Economia com o Simples Nacional"
                  : "Economia com o Lucro Presumido"
              }
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Comparativo de carga tributária</CardTitle>
              <CardDescription>Valores mensais e alíquota efetiva de cada regime.</CardDescription>
            </CardHeader>
            <CardContent className="h-[360px]">
              {resultados.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Registre lançamentos mensais para gerar o comparativo.
                </p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={resultados.map((r) => ({
                      competencia: r.competencia,
                      Simples: Number(r.simplesTotal.toFixed(2)),
                      Presumido: Number(r.presumido.total.toFixed(2)),
                      "Alíq. Simples": Number(r.simplesAliquota.toFixed(2)),
                      "Alíq. Presumido": Number(r.presumido.aliquota.toFixed(2)),
                    }))}
                    margin={{ top: 8, right: 8, bottom: 0, left: 8 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis dataKey="competencia" fontSize={12} stroke="var(--color-muted-foreground)" />
                    <YAxis yAxisId="left" fontSize={12} stroke="var(--color-muted-foreground)" />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      fontSize={12}
                      stroke="var(--color-muted-foreground)"
                      unit="%"
                    />
                    <Tooltip
                      formatter={(value: number, name: string) =>
                        name.startsWith("Alíq") ? pct(value) : brl(value)
                      }
                    />
                    <Legend />
                    <Bar yAxisId="left" dataKey="Simples" fill="var(--color-chart-1)" radius={[3, 3, 0, 0]} />
                    <Bar yAxisId="left" dataKey="Presumido" fill="var(--color-chart-2)" radius={[3, 3, 0, 0]} />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="Alíq. Simples"
                      stroke="var(--color-chart-3)"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="Alíq. Presumido"
                      stroke="var(--color-chart-5)"
                      strokeWidth={2}
                      dot={false}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Demonstrativo mês a mês</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-muted-foreground">
                      <th className="px-6 py-2 font-medium">Competência</th>
                      <th className="px-3 py-2 text-right font-medium">Faturamento</th>
                      <th className="px-3 py-2 text-right font-medium">RBT12</th>
                      <th className="px-3 py-2 text-right font-medium">Fator R</th>
                      <th className="px-3 py-2 text-right font-medium">Simples</th>
                      <th className="px-3 py-2 font-medium">Anexo</th>
                      <th className="px-3 py-2 text-right font-medium">Alíq. SN</th>
                      <th className="px-3 py-2 text-right font-medium">Presumido</th>
                      <th className="px-3 py-2 text-right font-medium">Alíq. LP</th>
                      <th className="px-3 py-2 text-right font-medium">Diferença</th>
                      <th className="px-6 py-2 text-right font-medium">Memória</th>
                    </tr>
                  </thead>
                  <tbody className="num">
                    {resultados.map((r) => (
                      <Fragment key={r.competencia}>
                        <tr className="border-b border-border/60">
                          <td className="px-6 py-2">{r.competencia}</td>
                          <td className="px-3 py-2 text-right">{brl(r.faturamentoTotal)}</td>
                          <td className="px-3 py-2 text-right">{brl(r.rbt12)}</td>
                          <td className="px-3 py-2 text-right">{pct(r.fatorR * 100)}</td>
                          <td className="px-3 py-2 text-right">{brl(r.simplesTotal)}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">
                            {r.anexos
                              .filter((a) => a.faturamento > 0)
                              .map((a) => (a.anexo === "V" && r.fatorRAtingido ? "V → III" : a.anexo))
                              .join(", ") || "—"}
                          </td>
                          <td className="px-3 py-2 text-right">{pct(r.simplesAliquota)}</td>
                          <td className="px-3 py-2 text-right">{brl(r.presumido.total)}</td>
                          <td className="px-3 py-2 text-right">{pct(r.presumido.aliquota)}</td>
                          <td
                            className={`px-3 py-2 text-right font-medium ${
                              r.economia >= 0 ? "text-success" : "text-destructive"
                            }`}
                          >
                            {brl(r.economia)}
                          </td>
                          <td className="px-6 py-2 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              aria-expanded={expandido === r.competencia}
                              onClick={() =>
                                setExpandido(expandido === r.competencia ? null : r.competencia)
                              }
                            >
                              {expandido === r.competencia ? "Ocultar" : "Detalhar"}
                            </Button>
                          </td>
                        </tr>
                        {expandido === r.competencia && (
                          <tr className="border-b border-border/60">
                            <td colSpan={11} className="p-0">
                              <MemoriaCalculo r={r} />
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    ))}
                    {resultados.length === 0 && (
                      <tr>
                        <td colSpan={11} className="px-6 py-6 text-muted-foreground">
                          Sem dados calculados.
                        </td>
                      </tr>
                    )}

                  </tbody>
                  {resultados.length > 0 && (
                    <tfoot>
                      <tr className="num font-semibold">
                        <td className="px-6 py-3">Acumulado</td>
                        <td className="px-3 py-3 text-right">{brl(acumulado.faturamento)}</td>
                        <td colSpan={2} />
                        <td className="px-3 py-3 text-right">{brl(acumulado.simples)}</td>
                        <td className="px-3 py-3" />
                        <td className="px-3 py-3 text-right">
                          {pct(
                            acumulado.faturamento > 0
                              ? (acumulado.simples / acumulado.faturamento) * 100
                              : 0,
                          )}
                        </td>
                        <td className="px-3 py-3 text-right">{brl(acumulado.presumido)}</td>
                        <td className="px-3 py-3 text-right">
                          {pct(
                            acumulado.faturamento > 0
                              ? (acumulado.presumido / acumulado.faturamento) * 100
                              : 0,
                          )}
                        </td>
                        <td className="px-3 py-3 text-right">
                          {brl(acumulado.presumido - acumulado.simples)}
                        </td>
                        <td className="px-6 py-3" />
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Indicador({ titulo, valor, nota }: { titulo: string; valor: string; nota?: string | undefined }) {
  return (
    <Card>
      <CardContent className="space-y-1 py-5">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{titulo}</p>
        <p className="num text-2xl font-semibold">{valor}</p>
        {nota && <p className="text-xs text-muted-foreground">{nota}</p>}
      </CardContent>
    </Card>
  );
}
