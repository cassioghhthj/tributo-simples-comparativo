import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { EmpresaForm, valoresPadrao, type EmpresaFormValues } from "@/components/EmpresaForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { nomeMes } from "@/lib/format";

export const Route = createFileRoute("/empresas/$id")({
  head: () => ({
    meta: [
      { title: "Cadastro do cliente | Simulador Tributário Martins & Ferri" },
      {
        name: "description",
        content: "Edite os dados e parâmetros tributários do cliente e acompanhe suas apurações.",
      },
      { property: "og:title", content: "Cadastro do cliente | Simulador Tributário" },
      {
        property: "og:description",
        content: "Dados cadastrais, parâmetros do Lucro Presumido e apurações da empresa.",
      },
    ],
  }),
  component: EditarEmpresa,
});

function EditarEmpresa() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const [values, setValues] = useState<EmpresaFormValues>(valoresPadrao);

  const dados = useQuery({
    queryKey: ["empresa", id],
    queryFn: async () => {
      const [empresa, parametros, apuracoes] = await Promise.all([
        supabase.from("empresas").select("*").eq("id", id).single(),
        supabase.from("parametros_empresa").select("*").eq("empresa_id", id).maybeSingle(),
        supabase
          .from("apuracoes")
          .select("id, descricao, ano_inicial, mes_inicial, ano_tabela")
          .eq("empresa_id", id)
          .order("created_at", { ascending: false }),
      ]);
      if (empresa.error) throw empresa.error;
      return { empresa: empresa.data, parametros: parametros.data, apuracoes: apuracoes.data ?? [] };
    },
  });

  useEffect(() => {
    if (!dados.data) return;
    const { empresa, parametros } = dados.data;
    setValues({
      nome: empresa.nome ?? "",
      cnpj: empresa.cnpj ?? "",
      atividade: empresa.atividade ?? "",
      anexo_predominante: empresa.anexo_predominante ?? "III",
      perc_iss: String(parametros?.perc_iss ?? valoresPadrao.perc_iss),
      perc_presuncao_servico: String(parametros?.perc_presuncao_servico ?? valoresPadrao.perc_presuncao_servico),
      perc_presuncao_comercio: String(parametros?.perc_presuncao_comercio ?? valoresPadrao.perc_presuncao_comercio),
      perc_icms: String(parametros?.perc_icms ?? valoresPadrao.perc_icms),
      perc_ipi: String(parametros?.perc_ipi ?? valoresPadrao.perc_ipi),
      perc_inss_prolabore: String(parametros?.perc_inss_prolabore ?? valoresPadrao.perc_inss_prolabore),
      perc_encargo_patronal: String(parametros?.perc_encargo_patronal ?? valoresPadrao.perc_encargo_patronal),
      prolabore_padrao: String(parametros?.prolabore_padrao ?? valoresPadrao.prolabore_padrao),
    });
  }, [dados.data]);

  const salvar = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("empresas")
        .update({
          nome: values.nome.trim(),
          cnpj: values.cnpj.trim() || null,
          atividade: values.atividade.trim() || null,
          anexo_predominante: values.anexo_predominante,
        })
        .eq("id", id);
      if (error) throw error;

      const { error: e2 } = await supabase.from("parametros_empresa").upsert(
        {
          empresa_id: id,
          perc_iss: Number(values.perc_iss) || 0,
          perc_presuncao_servico: Number(values.perc_presuncao_servico) || 0,
          perc_presuncao_comercio: Number(values.perc_presuncao_comercio) || 0,
          perc_icms: Number(values.perc_icms) || 0,
          perc_ipi: Number(values.perc_ipi) || 0,
          perc_inss_prolabore: Number(values.perc_inss_prolabore) || 0,
          perc_encargo_patronal: Number(values.perc_encargo_patronal) || 0,
          prolabore_padrao: Number(values.prolabore_padrao) || 0,
        },
        { onConflict: "empresa_id" },
      );
      if (e2) throw e2;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["empresa", id] });
      qc.invalidateQueries({ queryKey: ["empresas"] });
      toast.success("Cadastro atualizado.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (dados.isLoading) return <p className="text-sm text-muted-foreground">Carregando…</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold">{dados.data?.empresa.nome}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Dados cadastrais e parâmetros tributários.</p>
        </div>
        <Button asChild variant="outline">
          <Link to="/apuracoes/nova">Iniciar apuração</Link>
        </Button>
      </div>

      <EmpresaForm
        values={values}
        onChange={setValues}
        onSubmit={() => salvar.mutate()}
        salvando={salvar.isPending}
        textoBotao="Salvar alterações"
      />

      <Card>
        <CardHeader>
          <CardTitle>Apurações desta empresa</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {dados.data?.apuracoes.length === 0 && (
            <p className="px-6 pb-6 text-sm text-muted-foreground">Nenhuma apuração iniciada.</p>
          )}
          <ul className="divide-y divide-border">
            {dados.data?.apuracoes.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 px-6 py-4">
                <div>
                  <p className="font-medium">{a.descricao || "Apuração"}</p>
                  <p className="text-sm text-muted-foreground">
                    Início em {nomeMes(a.mes_inicial)}/{a.ano_inicial} · tabela {a.ano_tabela}
                  </p>
                </div>
                <Button asChild size="sm" variant="outline">
                  <Link to="/apuracoes/$id" params={{ id: a.id }}>
                    Abrir
                  </Link>
                </Button>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
