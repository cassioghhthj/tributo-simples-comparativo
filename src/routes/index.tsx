import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Building2, FileSpreadsheet, Plus } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { nomeMes } from "@/lib/format";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Empresas | Martins & Ferri — Simulador Tributário" },
      {
        name: "description",
        content:
          "Carteira de clientes e apurações de comparativo entre Simples Nacional e Lucro Presumido.",
      },
      { property: "og:title", content: "Empresas | Simulador Tributário Martins & Ferri" },
      {
        property: "og:description",
        content: "Gerencie clientes, parâmetros e apurações mensais de carga tributária.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const empresas = useQuery({
    queryKey: ["empresas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("empresas")
        .select("id, nome, cnpj, atividade, anexo_predominante")
        .order("nome");
      if (error) throw error;
      return data;
    },
  });

  const apuracoes = useQuery({
    queryKey: ["apuracoes-recentes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("apuracoes")
        .select("id, descricao, ano_inicial, mes_inicial, ano_tabela, empresas(nome)")
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-10">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Carteira de clientes</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Cadastro de empresas, parâmetros do Lucro Presumido e apurações mensais.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link to="/apuracoes/nova">
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Iniciar apuração
            </Link>
          </Button>
          <Button asChild>
            <Link to="/empresas/nova">
              <Plus className="mr-2 h-4 w-4" />
              Nova empresa
            </Link>
          </Button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {empresas.isLoading && <p className="text-sm text-muted-foreground">Carregando empresas…</p>}
        {empresas.data?.length === 0 && (
          <Card className="md:col-span-2 lg:col-span-3">
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              Nenhuma empresa cadastrada ainda. Comece cadastrando o primeiro cliente.
            </CardContent>
          </Card>
        )}
        {empresas.data?.map((e) => (
          <Card key={e.id} className="transition-shadow hover:shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-start justify-between gap-2 text-base">
                <span className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  {e.nome}
                </span>
                <Badge variant="secondary">Anexo {e.anexo_predominante}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p className="num">{e.cnpj || "CNPJ não informado"}</p>
              <p className="line-clamp-2">{e.atividade || "Atividade não descrita"}</p>
              <Button asChild variant="outline" size="sm">
                <Link to="/empresas/$id" params={{ id: e.id }}>
                  Abrir cadastro
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </section>

      <section>
        <h2 className="mb-3 text-xl font-semibold">Apurações recentes</h2>
        <Card>
          <CardContent className="p-0">
            {apuracoes.data?.length === 0 && (
              <p className="p-6 text-sm text-muted-foreground">Nenhuma apuração iniciada.</p>
            )}
            <ul className="divide-y divide-border">
              {apuracoes.data?.map((a) => (
                <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
                  <div>
                    <p className="font-medium">
                      {(a.empresas as { nome: string } | null)?.nome ?? "Empresa"}
                      {a.descricao ? ` — ${a.descricao}` : ""}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Início em {nomeMes(a.mes_inicial)}/{a.ano_inicial} · tabela {a.ano_tabela}
                    </p>
                  </div>
                  <Button asChild size="sm" variant="outline">
                    <Link to="/apuracoes/$id" params={{ id: a.id }}>
                      Abrir apuração
                    </Link>
                  </Button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
