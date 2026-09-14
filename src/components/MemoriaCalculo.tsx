import type { DetalheAnexo, ResultadoMes, Tributos } from "@/lib/calculo";
import { brl, pct } from "@/lib/format";

const ROTULOS: { key: keyof Tributos; label: string }[] = [
  { key: "irpj", label: "IRPJ" },
  { key: "csll", label: "CSLL" },
  { key: "cofins", label: "COFINS" },
  { key: "pis", label: "PIS" },
  { key: "cpp", label: "CPP" },
  { key: "icms", label: "ICMS" },
  { key: "iss", label: "ISS" },
  { key: "ipi", label: "IPI" },
];

function Cabecalho({ titulo }: { titulo: string }) {
  return <h4 className="mb-2 text-sm font-semibold">{titulo}</h4>;
}

function LinhaTabela({
  label,
  valor,
  faturamento,
  detalhe,
}: {
  label: string;
  valor: number;
  faturamento: number;
  detalhe?: string;
}) {
  return (
    <tr className="border-b border-border/50">
      <td className="py-1.5 pr-3">
        {label}
        {detalhe && <span className="block text-xs text-muted-foreground">{detalhe}</span>}
      </td>
      <td className="num py-1.5 text-right">{brl(valor)}</td>
      <td className="num py-1.5 text-right text-muted-foreground">
        {pct(faturamento > 0 ? (valor / faturamento) * 100 : 0, 4)}
      </td>
    </tr>
  );
}

function TabelaTributos({
  linhas,
  faturamento,
  total,
}: {
  linhas: { label: string; valor: number; detalhe?: string }[];
  faturamento: number;
  total: number;
}) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
          <th className="py-1.5 font-medium">Tributo</th>
          <th className="py-1.5 text-right font-medium">Valor</th>
          <th className="py-1.5 text-right font-medium">% s/ faturamento</th>
        </tr>
      </thead>
      <tbody>
        {linhas.map((l) => (
          <LinhaTabela
            key={l.label}
            label={l.label}
            valor={l.valor}
            faturamento={faturamento}
            {...(l.detalhe ? { detalhe: l.detalhe } : {})}
          />
        ))}
      </tbody>
      <tfoot>
        <tr className="font-semibold">
          <td className="py-2">Total</td>
          <td className="num py-2 text-right">{brl(total)}</td>
          <td className="num py-2 text-right">
            {pct(faturamento > 0 ? (total / faturamento) * 100 : 0, 4)}
          </td>
        </tr>
      </tfoot>
    </table>
  );
}

function BlocoAnexo({ d, faturamentoMes }: { d: DetalheAnexo; faturamentoMes: number }) {
  return (
    <div className="rounded-md border border-border/70 p-3">
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm font-medium">
          Anexo {d.anexo}
          {d.anexoAplicado !== d.anexo && (
            <span className="text-muted-foreground"> · tributado pelo Anexo {d.anexoAplicado} (Fator R)</span>
          )}
        </p>
        <p className="num text-xs text-muted-foreground">
          Receita {brl(d.faturamento)} · faixa {d.faixa ?? "—"} · alíquota efetiva {pct(d.aliquotaEfetiva, 4)}
        </p>
      </div>

      {d.erro && <p className="mb-2 text-xs text-destructive">{d.erro}</p>}

      {d.icmsPr && (
        <div className="mb-3 rounded bg-muted/50 p-2 text-xs">
          <p className="font-medium">Memória do ICMS-PR</p>
          <ul className="num mt-1 space-y-0.5 text-muted-foreground">
            <li>Alíquota de ICMS pela repartição do DAS: {pct(d.icmsPr.aliquotaAntes, 4)}</li>
            <li className="text-foreground">
              Alíquota efetiva de ICMS pela tabela PR (nominal − parcela a deduzir):{" "}
              {pct(d.icmsPr.aliquotaDepois, 4)}
            </li>
            <li>Redução equivalente (informativo): {pct(d.icmsPr.percentualReducao, 2)}</li>
          </ul>
        </div>
      )}

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
            <th className="py-1.5 font-medium">Tributo</th>
            <th className="py-1.5 text-right font-medium">Alíquota</th>
            <th className="py-1.5 text-right font-medium">Isento</th>
            <th className="py-1.5 text-right font-medium">Base</th>
            <th className="py-1.5 text-right font-medium">Valor</th>
          </tr>
        </thead>
        <tbody className="num">
          {ROTULOS.map(({ key, label }) => (
            <tr key={key} className="border-b border-border/50">
              <td className="py-1.5 pr-3 font-sans">{label}</td>
              <td className="py-1.5 text-right">{pct(d.aliquotas[key], 4)}</td>
              <td className="py-1.5 text-right text-muted-foreground">
                {d.isencoes[key] > 0 ? brl(d.isencoes[key]) : "—"}
              </td>
              <td className="py-1.5 text-right">{brl(d.bases[key])}</td>
              <td className="py-1.5 text-right">{brl(d.tributos[key])}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="num font-semibold">
            <td className="py-2 font-sans">Total do anexo</td>
            <td colSpan={3} />
            <td className="py-2 text-right">{brl(d.total)}</td>
          </tr>
        </tfoot>
      </table>
      {faturamentoMes > 0 && (
        <p className="mt-1 text-xs text-muted-foreground">
          Representa {pct((d.total / faturamentoMes) * 100, 4)} do faturamento do mês.
        </p>
      )}
    </div>
  );
}

export function MemoriaCalculo({ r }: { r: ResultadoMes }) {
  const f = r.faturamentoTotal;
  const p = r.presumido;
  const anexosComReceita = r.anexos.filter((a) => a.faturamento > 0);
  const temIsencao =
    r.isencoes.icms > 0 || r.isencoes.iss > 0 || r.isencoes.pis_cofins > 0 || r.isencoes.ipi > 0;

  return (
    <div className="space-y-6 bg-muted/30 px-6 py-5">
      <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-4">
        <p>
          Faturamento: <span className="num text-foreground">{brl(f)}</span>
        </p>
        <p>
          RBT12: <span className="num text-foreground">{brl(r.rbt12)}</span>
        </p>
        <p>
          Folha 12m: <span className="num text-foreground">{brl(r.folha12)}</span>
        </p>
        <p>
          Fator R: <span className="num text-foreground">{pct(r.fatorR * 100)}</span>{" "}
          {r.fatorRAtingido ? "(≥ 28%)" : "(< 28%)"}
        </p>
      </div>

      {temIsencao && (
        <p className="text-xs text-muted-foreground">
          Isenções do mês —{" "}
          <span className="num">
            ICMS {brl(r.isencoes.icms)} · ISS {brl(r.isencoes.iss)} · PIS/COFINS {brl(r.isencoes.pis_cofins)}{" "}
            · IPI {brl(r.isencoes.ipi)}
          </span>
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <Cabecalho titulo="Simples Nacional — consolidado" />
          <TabelaTributos
            faturamento={f}
            total={r.simplesTotal}
            linhas={ROTULOS.map(({ key, label }) => ({ label, valor: r.simplesTributos[key] }))}
          />
        </div>

        <div>
          <Cabecalho titulo="Lucro Presumido" />
          <TabelaTributos
            faturamento={f}
            total={p.total}
            linhas={[
              { label: "IRPJ", valor: p.irpj, detalhe: `Base presumida ${brl(p.baseComercio + p.baseServico)}` },
              { label: "Adicional de IRPJ", valor: p.adicionalIrpj },
              { label: "CSLL", valor: p.csll },
              { label: "COFINS", valor: p.cofins },
              { label: "PIS", valor: p.pis },
              { label: "ISS", valor: p.iss },
              { label: "ICMS", valor: p.icms },
              { label: "IPI", valor: p.ipi },
              { label: "INSS sobre pró-labore", valor: p.inssProlabore },
              { label: "CPP Patronal (folha)", valor: p.cppPatronal },
              { label: "Terceiros / Sistema S (folha)", valor: p.terceiros },
              { label: "RAT/SAT (folha)", valor: p.rat },
              { label: "Encargos sobre folha (subtotal)", valor: p.encargosSobreFolha },
            ]}
          />
        </div>
      </div>

      {anexosComReceita.length > 0 && (
        <div className="space-y-3">
          <Cabecalho titulo="Detalhamento por anexo (Simples Nacional)" />
          <div className="grid gap-3 xl:grid-cols-2">
            {anexosComReceita.map((d) => (
              <BlocoAnexo key={d.anexo} d={d} faturamentoMes={f} />
            ))}
          </div>
        </div>
      )}

      {r.avisos.length > 0 && (
        <ul className="list-disc space-y-1 pl-5 text-xs text-warning">
          {r.avisos.map((a) => (
            <li key={a}>{a}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
