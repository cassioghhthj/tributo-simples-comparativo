import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { mesesAnteriores } from "@/lib/calculo";
import { brl } from "@/lib/format";

export interface SementeLinha {
  ano: number;
  mes: number;
  rbt: number | string;
  folha: number | string;
}

interface Props {
  apuracaoId: string;
  anoInicial: number;
  mesInicial: number;
  semente: SementeLinha[];
  totalLancamentos: number;
}

type Estado = Record<string, { rbt: string; folha: string }>;

const chave = (ano: number, mes: number) => `${ano}-${mes}`;
const txt = (v: unknown) => (v === null || v === undefined || Number(v) === 0 ? "" : String(Number(v)));

export function EditarSemente({
  apuracaoId,
  anoInicial,
  mesInicial,
  semente,
  totalLancamentos,
}: Props) {
  const qc = useQueryClient();
  const [aberto, setAberto] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [valores, setValores] = useState<Estado>({});

  const janela = useMemo(
    () => mesesAnteriores(anoInicial, mesInicial, 12),
    [anoInicial, mesInicial],
  );

  // Recarrega os valores atuais sempre que o diálogo é aberto.
  useEffect(() => {
    if (!aberto) return;
    const inicial: Estado = {};
    for (const j of janela) inicial[chave(j.ano, j.mes)] = { rbt: "", folha: "" };
    for (const s of semente) {
      inicial[chave(s.ano, s.mes)] = { rbt: txt(s.rbt), folha: txt(s.folha) };
    }
    setValores(inicial);
  }, [aberto, janela, semente]);

  const setCampo = (key: string, campo: "rbt" | "folha", valor: string) =>
    setValores((s) => ({ ...s, [key]: { rbt: "", folha: "", ...s[key], [campo]: valor } }));

  const totalRbt = janela.reduce((a, j) => a + (Number(valores[chave(j.ano, j.mes)]?.rbt) || 0), 0);
  const totalFolha = janela.reduce((a, j) => a + (Number(valores[chave(j.ano, j.mes)]?.folha) || 0), 0);

  const salvar = useMutation({
    mutationFn: async () => {
      const linhas = janela.map((j) => ({
        apuracao_id: apuracaoId,
        ano: j.ano,
        mes: j.mes,
        rbt: Number(valores[chave(j.ano, j.mes)]?.rbt) || 0,
        folha: Number(valores[chave(j.ano, j.mes)]?.folha) || 0,
      }));
      const { error: eDel } = await supabase
        .from("apuracao_semente")
        .delete()
        .eq("apuracao_id", apuracaoId);
      if (eDel) throw eDel;
      const { error } = await supabase.from("apuracao_semente").insert(linhas);
      if (error) throw error;
    },
    onSuccess: async () => {
      setConfirmando(false);
      setAberto(false);
      toast.success("Dados iniciais atualizados — meses lançados recalculados.");
      await qc.invalidateQueries({ queryKey: ["apuracao-base", apuracaoId] });
      await qc.invalidateQueries({ queryKey: ["apuracao-calculo", apuracaoId] });
      await qc.refetchQueries({ queryKey: ["apuracao-calculo", apuracaoId] });
    },
    onError: (e: Error) => {
      setConfirmando(false);
      toast.error(e.message);
    },
  });

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setAberto(true)}>
        Editar dados iniciais
      </Button>

      <Dialog open={aberto} onOpenChange={(v) => !salvar.isPending && setAberto(v)}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar dados iniciais (semente)</DialogTitle>
            <DialogDescription>
              Receita bruta e folha dos 12 meses anteriores ao início da apuração. Esses valores são a
              base do RBT12 rolante e do Fator R de todos os meses lançados.
            </DialogDescription>
          </DialogHeader>

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
                  const key = chave(j.ano, j.mes);
                  return (
                    <tr key={key} className="border-b border-border/60">
                      <td className="num py-2 pr-3">
                        {String(j.mes).padStart(2, "0")}/{j.ano}
                      </td>
                      <td className="py-2 pr-3">
                        <Input
                          type="number"
                          step="0.01"
                          aria-label={`Receita bruta ${String(j.mes).padStart(2, "0")}/${j.ano}`}
                          className="num h-9"
                          value={valores[key]?.rbt ?? ""}
                          onChange={(e) => setCampo(key, "rbt", e.target.value)}
                        />
                      </td>
                      <td className="py-2">
                        <Input
                          type="number"
                          step="0.01"
                          aria-label={`Folha ${String(j.mes).padStart(2, "0")}/${j.ano}`}
                          className="num h-9"
                          value={valores[key]?.folha ?? ""}
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
                  <td className="num py-3">{brl(totalRbt)}</td>
                  <td className="num py-3">{brl(totalFolha)}</td>
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

          <DialogFooter>
            <Button variant="ghost" onClick={() => setAberto(false)} disabled={salvar.isPending}>
              Cancelar
            </Button>
            <Button onClick={() => setConfirmando(true)} disabled={salvar.isPending}>
              {salvar.isPending ? "Salvando…" : "Salvar dados iniciais"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmando} onOpenChange={setConfirmando}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Recalcular a apuração inteira?</AlertDialogTitle>
            <AlertDialogDescription>
              Alterar os dados iniciais muda o RBT12 e o Fator R de todos os{" "}
              {totalLancamentos} mês(es) já lançados desta apuração. Os tributos do Simples Nacional e
              do Lucro Presumido serão recalculados automaticamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={salvar.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => salvar.mutate()} disabled={salvar.isPending}>
              {salvar.isPending ? "Salvando…" : "Salvar e recalcular"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
