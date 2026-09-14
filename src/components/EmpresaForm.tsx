import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface EmpresaFormValues {
  nome: string;
  cnpj: string;
  atividade: string;
  anexo_predominante: string;
  perc_iss: string;
  perc_presuncao_servico: string;
  perc_presuncao_comercio: string;
  perc_icms: string;
  perc_ipi: string;
  perc_inss_prolabore: string;
  perc_cpp_patronal: string;
  perc_terceiros: string;
  perc_rat: string;
  prolabore_padrao: string;
}

export const valoresPadrao: EmpresaFormValues = {
  nome: "",
  cnpj: "",
  atividade: "",
  anexo_predominante: "III",
  perc_iss: "5",
  perc_presuncao_servico: "32",
  perc_presuncao_comercio: "8",
  perc_icms: "0",
  perc_ipi: "0",
  perc_inss_prolabore: "11",
  perc_cpp_patronal: "20",
  perc_terceiros: "5.8",
  perc_rat: "2",
  prolabore_padrao: "0",
};

const ANEXOS = [
  { value: "I", label: "Anexo I — Comércio" },
  { value: "II", label: "Anexo II — Indústria" },
  { value: "III", label: "Anexo III — Serviços" },
  { value: "IV", label: "Anexo IV — Serviços" },
  { value: "V", label: "Anexo V — Serviços (Fator R)" },
];

const CAMPOS_PARAM: { key: keyof EmpresaFormValues; label: string; sufixo: string; ajuda?: string }[] = [
  { key: "perc_iss", label: "ISS no Presumido", sufixo: "%" },
  {
    key: "perc_presuncao_servico",
    label: "Presunção IRPJ/CSLL — serviços",
    sufixo: "%",
    ajuda: "Base de presunção sobre receita de serviços (ex.: 32%).",
  },
  {
    key: "perc_presuncao_comercio",
    label: "Presunção IRPJ/CSLL — comércio",
    sufixo: "%",
    ajuda: "Base de presunção sobre receita de comércio/indústria (ex.: 8%).",
  },
  { key: "perc_icms", label: "ICMS no Presumido", sufixo: "%" },
  { key: "perc_ipi", label: "IPI no Presumido", sufixo: "%" },
  { key: "perc_inss_prolabore", label: "INSS sobre pró-labore", sufixo: "%" },
  {
    key: "perc_cpp_patronal",
    label: "CPP Patronal",
    sufixo: "%",
    ajuda: "Contribuição previdenciária patronal sobre a folha + pró-labore.",
  },
  {
    key: "perc_terceiros",
    label: "Terceiros / Sistema S",
    sufixo: "%",
    ajuda: "Contribuições a terceiros (Sistema S). Varia conforme FPAS/CNAE.",
  },
  {
    key: "perc_rat",
    label: "RAT/SAT",
    sufixo: "%",
    ajuda: "Seguro acidente de trabalho. Varia conforme o grau de risco da atividade.",
  },
  { key: "prolabore_padrao", label: "Pró-labore mensal padrão", sufixo: "R$" },
];

export function EmpresaForm({
  values,
  onChange,
  onSubmit,
  salvando,
  textoBotao,
}: {
  values: EmpresaFormValues;
  onChange: (v: EmpresaFormValues) => void;
  onSubmit: () => void;
  salvando: boolean;
  textoBotao: string;
}) {
  const [erro, setErro] = useState("");
  const set = (key: keyof EmpresaFormValues, value: string) => onChange({ ...values, [key]: value });

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        if (!values.nome.trim()) {
          setErro("Informe o nome da empresa.");
          return;
        }
        setErro("");
        onSubmit();
      }}
    >
      <Card>
        <CardHeader>
          <CardTitle>Dados da empresa</CardTitle>
          <CardDescription>Identificação do cliente e anexo predominante do Simples.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="nome">Razão social / nome</Label>
            <Input id="nome" value={values.nome} onChange={(e) => set("nome", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cnpj">CNPJ (opcional)</Label>
            <Input
              id="cnpj"
              className="num"
              value={values.cnpj}
              onChange={(e) => set("cnpj", e.target.value)}
              placeholder="00.000.000/0000-00"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="atividade">Atividade / descrição</Label>
            <Textarea
              id="atividade"
              rows={2}
              value={values.atividade}
              onChange={(e) => set("atividade", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Anexo predominante</Label>
            <Select
              value={values.anexo_predominante}
              onValueChange={(v) => set("anexo_predominante", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ANEXOS.map((a) => (
                  <SelectItem key={a.value} value={a.value}>
                    {a.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Parâmetros do Lucro Presumido</CardTitle>
          <CardDescription>
            Percentuais utilizados no comparativo. Podem ser ajustados a qualquer momento.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {CAMPOS_PARAM.map((c) => (
            <div key={c.key} className="space-y-2">
              <Label htmlFor={c.key}>
                {c.label} <span className="text-muted-foreground">({c.sufixo})</span>
              </Label>
              <Input
                id={c.key}
                type="number"
                step="0.01"
                className="num"
                value={values[c.key]}
                onChange={(e) => set(c.key, e.target.value)}
              />
              {c.ajuda && <p className="text-xs text-muted-foreground">{c.ajuda}</p>}
            </div>
          ))}
        </CardContent>
      </Card>

      {erro && <p className="text-sm text-destructive">{erro}</p>}

      <Button type="submit" disabled={salvando}>
        {salvando ? "Salvando…" : textoBotao}
      </Button>
    </form>
  );
}
