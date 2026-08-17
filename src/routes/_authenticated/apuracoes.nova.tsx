import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MESES, brl, nomeMes } from "@/lib/format";
import { mesesAnteriores } from "@/lib/calculo";

export const Route = createFileRoute("/_authenticated/apuracoes/nova")({
  head: () => ({
    meta: [
      { title: "Iniciar apuração | Simulador Tributário Martins & Ferri" },
      {
        name: "description",
        content:
          "Inicie uma apuração informando a competência inicial e os 12 meses anteriores de receita e folha.",
      },
      { property: "og:title", content: "Iniciar apuração | Simulador Tributário" },
      {
        property: "og:description",
        content: "Semente de 12 meses de receita bruta e folha para cálculo do RBT12 e do Fator R.",
      },
    ],
  }),
  component: NovaApuracao,
});

const anoAtual = new Date().getFullYear();

function NovaApuracao() {
  const navigate = useNavigate();
  const [empresaId, setEmpresaId] = useState("");
  const [descricao, setDescricao] = useState("");
  const [mes, setMes] = useState(String(new Date().getMonth() + 1));
  const [ano, setAno] = useState(String(anoAtual));
  const [anoTabela, setAnoTabela] = useState(String(anoAtual));
  const [semente, setSemente] = useState<Record<string, { rbt: string; folha: string }>>({});

  const empresas = useQuery({
    queryKey: ["empresas"],
    queryFn: async () => {
      const { data, error } = await supabase.from("empresas").select("id, nome").order("nome");
      if (error) throw error;
      return data;
    },
  });

  const janela = useMemo(
    () => mesesAnteriores(Number(ano), Number(mes), 12),
    [ano, mes],
  );

  const totalRbt = janela.reduce(
    (acc, j) => acc + (Number(semente[`${j.ano}-${j.mes}`]?.rbt) || 0),
    0,
  );
  const totalFolha = janela.reduce(
    (acc, j) => acc + (Number(semente[`${j.ano}-${j.mes}`]?.folha) || 0),
    0,
  );

  const criar = useMutation({
    mutationFn: async () => {
      if (!empresaId) throw new Error("Selecione a empresa.");
      const { data: apuracao, error } = await supabase
        .from("apuracoes")
        .insert({
          empresa_id: empresaId,
          descricao: descricao.trim() || null,
          ano_inicial: Number(ano),
          mes_inicial: Number(mes),
          ano_tabela: Number(anoTabela),
        })
        .select("id")
        .single();
      if (error) throw error;

      const linhas = janela.map((j) => ({
        apuracao_id: apuracao.id,
        ano: j.ano,
        mes: j.mes,
        rbt: Number(semente[`${j.ano}-${j.mes}`]?.rbt) || 0,
        folha: Number(semente[`${j.ano}-${j.mes}`]?.folha) || 0,
      }));
      const { error: e2 } = await supabase.from("apuracao_semente").insert(linhas);
      if (e2) throw e2;
      return apuracao.id;
    },
    onSuccess: (id) => {
      toast.success("Apuração iniciada.");
      navigate({ to: "/apuracoes/$id", params: { id } });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const setCampo = (key: string, campo: "rbt" | "folha", valor: string) =>
    setSemente((s) => ({ ...s, [key]: { rbt: "", folha: "", ...s[key], [campo]: valor } }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Iniciar apuração</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Informe a competência inicial e os 12 meses imediatamente anteriores (receita bruta e folha).
          Esses dados são lançados uma única vez e servem de base para o RBT12 e o Fator R.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Identificação</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <div className="space-y-2 md:col-span-2">
            <Label>Empresa</Label>
            <Select value={empresaId} onValueChange={setEmpresaId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o cliente" />
              </SelectTrigger>
              <SelectContent>
                {empresas.data?.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Mês inicial</Label>
            <Select value={mes} onValueChange={setMes}>
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
            <Label htmlFor="ano">Ano inicial</Label>
            <Input id="ano" className="num" type="number" value={ano} onChange={(e) => setAno(e.target.value)} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="desc">Descrição (opcional)</Label>
            <Input id="desc" value={descricao} onChange={(e) => setDescricao(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="anoTab">Ano da tabela</Label>
            <Input
              id="anoTab"
              className="num"
              type="number"
              value={anoTabela}
              onChange={(e) => setAnoTabela(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Vigência das tabelas do Simples e do ICMS/PR.</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Semente — 12 meses anteriores</CardTitle>
          <CardDescription>
            Receita bruta total e folha de pagamento dos 12 meses anteriores a{" "}
            {nomeMes(Number(mes))}/{ano}.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="py-2 font-medium">Competência</th>
                  <th className="py-2 font-medium">Receita bruta (R$)</th>
                  <th className="py-2 font-medium">Folha (R$)</th>
                </tr>
              </thead>
              <tbody>
                {janela.map((j) => {
                  const key = `${j.ano}-${j.mes}`;
                  return (
                    <tr key={key} className="border-b border-border/60">
                      <td className="py-2 num">
                        {String(j.mes).padStart(2, "0")}/{j.ano}
                      </td>
                      <td className="py-2 pr-3">
                        <Input
                          type="number"
                          step="0.01"
                          className="num h-9"
                          value={semente[key]?.rbt ?? ""}
                          onChange={(e) => setCampo(key, "rbt", e.target.value)}
                        />
                      </td>
                      <td className="py-2">
                        <Input
                          type="number"
                          step="0.01"
                          className="num h-9"
                          value={semente[key]?.folha ?? ""}
                          onChange={(e) => setCampo(key, "folha", e.target.value)}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="font-medium">
                  <td className="py-3">Total (RBT12 / Folha12 iniciais)</td>
                  <td className="py-3 num">{brl(totalRbt)}</td>
                  <td className="py-3 num">{brl(totalFolha)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
          <p className="text-sm text-muted-foreground">
            Fator R inicial:{" "}
            <span className="num font-medium text-foreground">
              {totalRbt > 0 ? ((totalFolha / totalRbt) * 100).toFixed(2) : "0,00"}%
            </span>
          </p>
        </CardContent>
      </Card>

      <Button onClick={() => criar.mutate()} disabled={criar.isPending}>
        {criar.isPending ? "Criando…" : "Criar apuração"}
      </Button>
    </div>
  );
}
