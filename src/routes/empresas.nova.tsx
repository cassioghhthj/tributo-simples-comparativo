import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { EmpresaForm, valoresPadrao, type EmpresaFormValues } from "@/components/EmpresaForm";

export const Route = createFileRoute("/empresas/nova")({
  head: () => ({
    meta: [
      { title: "Nova empresa | Simulador Tributário Martins & Ferri" },
      {
        name: "description",
        content: "Cadastre um novo cliente e defina os parâmetros de tributação do Lucro Presumido.",
      },
      { property: "og:title", content: "Nova empresa | Simulador Tributário" },
      {
        property: "og:description",
        content: "Cadastro de cliente com parâmetros de presunção, ISS, ICMS, IPI e pró-labore.",
      },
    ],
  }),
  component: NovaEmpresa,
});

function NovaEmpresa() {
  const [values, setValues] = useState<EmpresaFormValues>(valoresPadrao);
  const navigate = useNavigate();
  const qc = useQueryClient();

  const salvar = useMutation({
    mutationFn: async () => {
      const { data: empresa, error } = await supabase
        .from("empresas")
        .insert({
          nome: values.nome.trim(),
          cnpj: values.cnpj.trim() || null,
          atividade: values.atividade.trim() || null,
          anexo_predominante: values.anexo_predominante,
        })
        .select("id")
        .single();
      if (error) throw error;

      const { error: e2 } = await supabase.from("parametros_empresa").insert({
        empresa_id: empresa.id,
        perc_iss: Number(values.perc_iss) || 0,
        perc_presuncao_servico: Number(values.perc_presuncao_servico) || 0,
        perc_presuncao_comercio: Number(values.perc_presuncao_comercio) || 0,
        perc_icms: Number(values.perc_icms) || 0,
        perc_ipi: Number(values.perc_ipi) || 0,
        perc_inss_prolabore: Number(values.perc_inss_prolabore) || 0,
        perc_encargo_patronal: Number(values.perc_encargo_patronal) || 0,
        prolabore_padrao: Number(values.prolabore_padrao) || 0,
      });
      if (e2) throw e2;
      return empresa.id;
    },
    onSuccess: (id) => {
      qc.invalidateQueries({ queryKey: ["empresas"] });
      toast.success("Empresa cadastrada com sucesso.");
      navigate({ to: "/empresas/$id", params: { id } });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Nova empresa</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Cadastro do cliente e parâmetros usados no comparativo de carga tributária.
        </p>
      </div>
      <EmpresaForm
        values={values}
        onChange={setValues}
        onSubmit={() => salvar.mutate()}
        salvando={salvar.isPending}
        textoBotao="Cadastrar empresa"
      />
    </div>
  );
}
