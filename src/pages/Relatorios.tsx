import { useMemo, useState } from "react";
import { useApp } from "@/context/AppContext";
import type { Venda } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend,
} from "recharts";
import { FileText, Download, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { toast } from "sonner";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function fmtPct(v: number) { return `${v.toFixed(1)}%`; }
function parseData(s: string): Date {
  const p = s.split("/");
  if (p.length === 3) return new Date(+p[2], +p[1] - 1, +p[0]);
  return new Date(s);
}
function getValor(v: Venda)  { return v.tipo === "perfume" ? v.valorFinal : v.precoVenda; }
function getCusto(v: Venda)  { return v.tipo === "perfume" ? v.precoBrl : v.precoCusto; }
function getLucro(v: Venda)  { return getValor(v) - getCusto(v); }
function calcRecebido(v: Venda): number {
  const total = getValor(v);
  const entrada = v.valorEntrada ?? 0;
  if (v.tipoPagamento === "parcelado" && v.parcelas.length > 0) {
    const norm = v.parcelas.filter((p) => p.numero > 0);
    const vp = norm.length > 0 ? (total - entrada) / norm.length : 0;
    return v.parcelas.reduce((s, p) => {
      if (p.status !== "pago") return s;
      return s + (p.valorPago && p.valorPago > 0 ? p.valorPago : p.numero === 0 ? entrada : vp);
    }, 0);
  }
  return v.status === "pago" ? total : 0;
}

const MESES = [
  "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro",
];
const hoje = new Date();
const anoAtual = hoje.getFullYear();
const ANOS = [anoAtual, anoAtual - 1, anoAtual - 2];

// ─── Tooltip customizado ──────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl p-3 shadow-lg text-xs space-y-1">
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.fill || p.color }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-medium">{fmtBRL(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Linha DRE ────────────────────────────────────────────────────────────────

function DRELinha({
  label, valor, sub, destaque, nivel = 0, tipo = "neutro",
}: {
  label: string; valor: number; sub?: string; destaque?: boolean;
  nivel?: number; tipo?: "positivo" | "negativo" | "neutro";
}) {
  const cor = tipo === "positivo" ? "text-success"
    : tipo === "negativo" ? "text-destructive"
    : "text-foreground";
  return (
    <div className={`flex items-center justify-between py-2.5 px-4 ${destaque ? "bg-muted/40 rounded-lg font-semibold" : "border-b border-border/40"}`}
      style={{ paddingLeft: `${16 + nivel * 20}px` }}>
      <div>
        <span className={`text-sm ${destaque ? "font-bold" : "text-muted-foreground"}`}>{label}</span>
        {sub && <span className="text-xs text-muted-foreground ml-2">{sub}</span>}
      </div>
      <span className={`text-sm font-semibold ${cor}`}>{fmtBRL(valor)}</span>
    </div>
  );
}

// ─── Exportação ───────────────────────────────────────────────────────────────

function exportarCSV(dados: Record<string, string | number>[], nomeArquivo: string) {
  const cabecalho = Object.keys(dados[0]).join(";");
  const linhas = dados.map((r) => Object.values(r).map((v) => `"${v}"`).join(";"));
  const csv = [cabecalho, ...linhas].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = nomeArquivo;
  a.click(); URL.revokeObjectURL(url);
}

// ─── Relatórios ───────────────────────────────────────────────────────────────

export default function Relatorios() {
  const { state } = useApp();
  const [ano, setAno] = useState(String(anoAtual));
  const [mes, setMes] = useState(String(hoje.getMonth() + 1));

  const anoNum = parseInt(ano);
  const mesNum = parseInt(mes);

  // ── Vendas filtradas por ano ─────────────────────────────────
  const vendasAno = useMemo(() =>
    state.vendas.filter((v) => parseData(v.data).getFullYear() === anoNum),
    [state.vendas, anoNum]);

  const vendasMes = useMemo(() =>
    vendasAno.filter((v) => parseData(v.data).getMonth() + 1 === mesNum),
    [vendasAno, mesNum]);

  // ── DRE Mensal ───────────────────────────────────────────────
  const dre = useMemo(() => {
    const receita     = vendasMes.reduce((s, v) => s + getValor(v), 0);
    const custos      = vendasMes.reduce((s, v) => s + getCusto(v), 0);
    const lucro       = receita - custos;
    const recebido    = vendasMes.reduce((s, v) => s + calcRecebido(v), 0);
    const aReceber    = receita - recebido;
    const margem      = receita > 0 ? (lucro / receita) * 100 : 0;
    const numVendas   = vendasMes.length;
    const ticket      = numVendas > 0 ? receita / numVendas : 0;

    // Por categoria
    const perfumes    = vendasMes.filter((v) => v.tipo === "perfume");
    const eletronicos = vendasMes.filter((v) => v.tipo === "eletronico");
    const recPerf     = perfumes.reduce((s, v) => s + getValor(v), 0);
    const recElet     = eletronicos.reduce((s, v) => s + getValor(v), 0);
    const custoPerf   = perfumes.reduce((s, v) => s + getCusto(v), 0);
    const custoElet   = eletronicos.reduce((s, v) => s + getCusto(v), 0);

    // Compras do mês (custo de aquisição)
    const comprasMes  = (state.compras ?? []).filter((c) => {
      const d = parseData(c.data);
      return d.getMonth() + 1 === mesNum && d.getFullYear() === anoNum;
    });
    const totalCompras = comprasMes.reduce((s, c) => s + c.preco_brl, 0);

    return {
      receita, custos, lucro, recebido, aReceber, margem, numVendas, ticket,
      recPerf, recElet, custoPerf, custoElet, totalCompras,
      lucroBruto: receita - custos,
    };
  }, [vendasMes, mesNum, anoNum, state.compras]);

  // ── Evolução mensal (12 meses do ano) ────────────────────────
  const evolucao = useMemo(() =>
    MESES.map((label, i) => {
      const mv = vendasAno.filter((v) => parseData(v.data).getMonth() === i);
      const receita = mv.reduce((s, v) => s + getValor(v), 0);
      const custo   = mv.reduce((s, v) => s + getCusto(v), 0);
      return { mes: label.slice(0, 3), Receita: +receita.toFixed(2), Custo: +custo.toFixed(2), Lucro: +(receita - custo).toFixed(2) };
    }),
    [vendasAno]);

  // ── Por vendedor ─────────────────────────────────────────────
  const porVendedor = useMemo(() => {
    const mapa: Record<string, { nome: string; receita: number; custo: number; recebido: number; numVendas: number }> = {};
    for (const v of vendasAno) {
      const nome = v.vendedor?.trim() || "Sem vendedor";
      if (!mapa[nome]) mapa[nome] = { nome, receita: 0, custo: 0, recebido: 0, numVendas: 0 };
      mapa[nome].receita   += getValor(v);
      mapa[nome].custo     += getCusto(v);
      mapa[nome].recebido  += calcRecebido(v);
      mapa[nome].numVendas++;
    }
    return Object.values(mapa)
      .map((v) => ({ ...v, lucro: v.receita - v.custo, margem: v.receita > 0 ? ((v.receita - v.custo) / v.receita) * 100 : 0 }))
      .sort((a, b) => b.receita - a.receita);
  }, [vendasAno]);

  // ── Por produto ──────────────────────────────────────────────
  const porProduto = useMemo(() => {
    const mapa: Record<string, { nome: string; tipo: string; receita: number; custo: number; unidades: number }> = {};
    for (const v of vendasAno) {
      const raw = v.tipo === "perfume" ? v.perfume : v.produto;
      const segs = raw.split(",");
      for (const seg of segs) {
        const t = seg.trim();
        const pi = t.indexOf("|");
        const nome = pi !== -1 ? t.slice(pi + 1).trim() : t;
        if (!mapa[nome]) mapa[nome] = { nome, tipo: v.tipo, receita: 0, custo: 0, unidades: 0 };
        const n = segs.length;
        mapa[nome].receita  += getValor(v) / n;
        mapa[nome].custo    += getCusto(v) / n;
        mapa[nome].unidades++;
      }
    }
    return Object.values(mapa)
      .map((p) => ({ ...p, lucro: p.receita - p.custo, margem: p.receita > 0 ? ((p.receita - p.custo) / p.receita) * 100 : 0 }))
      .sort((a, b) => b.receita - a.receita)
      .slice(0, 30);
  }, [vendasAno]);

  // ── Exportações ──────────────────────────────────────────────

  function exportarVendedores() {
    exportarCSV(porVendedor.map((v) => ({
      Vendedor: v.nome,
      Receita: v.receita.toFixed(2),
      Custo: v.custo.toFixed(2),
      Lucro: v.lucro.toFixed(2),
      Margem: fmtPct(v.margem),
      Recebido: v.recebido.toFixed(2),
      Vendas: v.numVendas,
    })), `relatorio_vendedores_${ano}.csv`);
    toast.success("Relatório exportado!");
  }

  function exportarProdutos() {
    exportarCSV(porProduto.map((p) => ({
      Produto: p.nome,
      Tipo: p.tipo,
      Unidades: p.unidades,
      Receita: p.receita.toFixed(2),
      Custo: p.custo.toFixed(2),
      Lucro: p.lucro.toFixed(2),
      Margem: fmtPct(p.margem),
    })), `relatorio_produtos_${ano}.csv`);
    toast.success("Relatório exportado!");
  }

  function exportarDRE() {
    exportarCSV([
      { Item: "Receita Bruta",           Valor: dre.receita.toFixed(2) },
      { Item: "  Perfumes",              Valor: dre.recPerf.toFixed(2) },
      { Item: "  Eletrônicos",           Valor: dre.recElet.toFixed(2) },
      { Item: "(-) Custo das Vendas",    Valor: (-dre.custos).toFixed(2) },
      { Item: "  CMV Perfumes",          Valor: (-dre.custoPerf).toFixed(2) },
      { Item: "  CMV Eletrônicos",       Valor: (-dre.custoElet).toFixed(2) },
      { Item: "= Lucro Bruto",           Valor: dre.lucroBruto.toFixed(2) },
      { Item: "Margem Bruta (%)",        Valor: fmtPct(dre.margem) },
      { Item: "Receita Recebida",        Valor: dre.recebido.toFixed(2) },
      { Item: "A Receber",               Valor: dre.aReceber.toFixed(2) },
      { Item: "Compras do Mês",          Valor: dre.totalCompras.toFixed(2) },
      { Item: "Nº de Vendas",            Valor: String(dre.numVendas) },
      { Item: "Ticket Médio",            Valor: dre.ticket.toFixed(2) },
    ], `DRE_${MESES[mesNum - 1]}_${ano}.csv`);
    toast.success("DRE exportada!");
  }

  const deltaIcon = (v: number) =>
    v > 0 ? <TrendingUp className="h-3.5 w-3.5 text-success" />
    : v < 0 ? <TrendingDown className="h-3.5 w-3.5 text-destructive" />
    : <Minus className="h-3.5 w-3.5 text-muted-foreground" />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <FileText className="h-5 w-5" /> Relatórios
          </h1>
          <p className="text-muted-foreground text-sm mt-1">DRE, análise por vendedor e produto</p>
        </div>
        {/* Filtros globais */}
        <div className="flex items-center gap-2">
          <Select value={ano} onValueChange={setAno}>
            <SelectTrigger className="h-9 w-24 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {ANOS.map((a) => <SelectItem key={a} value={String(a)}>{a}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={mes} onValueChange={setMes}>
            <SelectTrigger className="h-9 w-36 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {MESES.map((m, i) => <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="dre">
        <TabsList className="mb-4">
          <TabsTrigger value="dre">DRE Mensal</TabsTrigger>
          <TabsTrigger value="evolucao">Evolução Anual</TabsTrigger>
          <TabsTrigger value="vendedores">Por Vendedor</TabsTrigger>
          <TabsTrigger value="produtos">Por Produto</TabsTrigger>
        </TabsList>

        {/* ── DRE ─────────────────────────────────────────────── */}
        <TabsContent value="dre">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              DRE — {MESES[mesNum - 1]} {ano}
            </h2>
            <Button size="sm" variant="outline" onClick={exportarDRE}>
              <Download className="h-3.5 w-3.5 mr-1.5" />Exportar CSV
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Demonstrativo */}
            <div className="glass-card rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-border bg-muted/20">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Demonstrativo de Resultado</p>
              </div>
              <div className="space-y-0.5 py-2">
                <DRELinha label="Receita Bruta" valor={dre.receita} destaque tipo="positivo" />
                <DRELinha label="Perfumes"      valor={dre.recPerf}  nivel={1} />
                <DRELinha label="Eletrônicos"   valor={dre.recElet}  nivel={1} />
                <div className="py-1" />
                <DRELinha label="(-) Custo das Vendas (CMV)" valor={-dre.custos} tipo="negativo" />
                <DRELinha label="CMV Perfumes"    valor={-dre.custoPerf}  nivel={1} />
                <DRELinha label="CMV Eletrônicos" valor={-dre.custoElet}  nivel={1} />
                <div className="py-1" />
                <DRELinha label="= Lucro Bruto" valor={dre.lucroBruto} destaque tipo={dre.lucroBruto >= 0 ? "positivo" : "negativo"} sub={fmtPct(dre.margem) + " de margem"} />
                <div className="py-1 border-t border-border/40" />
                <DRELinha label="Receita Recebida"   valor={dre.recebido}      tipo="positivo" />
                <DRELinha label="A Receber"           valor={dre.aReceber}      tipo={dre.aReceber > 0 ? "negativo" : "neutro"} />
                <DRELinha label="Compras do Mês"      valor={-dre.totalCompras} tipo={dre.totalCompras > 0 ? "negativo" : "neutro"} />
              </div>
            </div>

            {/* KPIs do mês */}
            <div className="space-y-3">
              {[
                { label: "Receita Total",    valor: dre.receita,   cor: "text-foreground" },
                { label: "Lucro Bruto",      valor: dre.lucroBruto, cor: dre.lucroBruto >= 0 ? "text-success" : "text-destructive" },
                { label: "Margem",           valor: dre.margem,    cor: "text-primary", isPct: true },
                { label: "Recebido",         valor: dre.recebido,  cor: "text-success" },
                { label: "A Receber",        valor: dre.aReceber,  cor: dre.aReceber > 0 ? "text-warning" : "text-muted-foreground" },
                { label: "Ticket Médio",     valor: dre.ticket,    cor: "text-foreground" },
              ].map((k) => (
                <div key={k.label} className="glass-card rounded-xl p-4 flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">{k.label}</span>
                  <span className={`font-bold text-base ${k.cor}`}>
                    {k.isPct ? fmtPct(k.valor) : fmtBRL(k.valor)}
                  </span>
                </div>
              ))}
              <div className="glass-card rounded-xl p-4 flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Nº de Vendas</span>
                <span className="font-bold text-base">{dre.numVendas}</span>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ── Evolução Anual ───────────────────────────────────── */}
        <TabsContent value="evolucao">
          <div className="glass-card rounded-xl p-6">
            <p className="text-sm font-semibold text-muted-foreground mb-5">
              Receita, Custo e Lucro — {ano}
            </p>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={evolucao} barGap={4} barCategoryGap="25%">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                  tickFormatter={(v) => v >= 1000 ? `R$${(v/1000).toFixed(0)}k` : `R$${v}`}
                  axisLine={false} tickLine={false} width={60} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--muted)", opacity: 0.4 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Receita" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={20} />
                <Bar dataKey="Custo"   fill="#f87171" radius={[4, 4, 0, 0]} maxBarSize={20} />
                <Bar dataKey="Lucro"   fill="#34d399" radius={[4, 4, 0, 0]} maxBarSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Tabela resumo anual */}
          <div className="glass-card rounded-xl overflow-hidden mt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mês</TableHead>
                  <TableHead className="text-right">Receita</TableHead>
                  <TableHead className="text-right">Custo</TableHead>
                  <TableHead className="text-right">Lucro</TableHead>
                  <TableHead className="text-right">Margem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {evolucao.map((r) => {
                  const margem = r.Receita > 0 ? (r.Lucro / r.Receita) * 100 : 0;
                  return (
                    <TableRow key={r.mes}>
                      <TableCell className="font-medium text-sm">{r.mes}</TableCell>
                      <TableCell className="text-right text-sm">{fmtBRL(r.Receita)}</TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">{fmtBRL(r.Custo)}</TableCell>
                      <TableCell className={`text-right text-sm font-semibold ${r.Lucro >= 0 ? "text-success" : "text-destructive"}`}>
                        {fmtBRL(r.Lucro)}
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">{fmtPct(margem)}</TableCell>
                    </TableRow>
                  );
                })}
                {/* Total */}
                <TableRow className="bg-muted/30 font-bold">
                  <TableCell>Total {ano}</TableCell>
                  <TableCell className="text-right">{fmtBRL(evolucao.reduce((s, r) => s + r.Receita, 0))}</TableCell>
                  <TableCell className="text-right text-muted-foreground">{fmtBRL(evolucao.reduce((s, r) => s + r.Custo, 0))}</TableCell>
                  <TableCell className="text-right text-success">{fmtBRL(evolucao.reduce((s, r) => s + r.Lucro, 0))}</TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {fmtPct(
                      evolucao.reduce((s, r) => s + r.Receita, 0) > 0
                        ? (evolucao.reduce((s, r) => s + r.Lucro, 0) / evolucao.reduce((s, r) => s + r.Receita, 0)) * 100
                        : 0
                    )}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* ── Por Vendedor ─────────────────────────────────────── */}
        <TabsContent value="vendedores">
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-muted-foreground">{porVendedor.length} vendedor(es) em {ano}</p>
            <Button size="sm" variant="outline" onClick={exportarVendedores}>
              <Download className="h-3.5 w-3.5 mr-1.5" />Exportar CSV
            </Button>
          </div>
          <div className="glass-card rounded-xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vendedor</TableHead>
                  <TableHead className="text-right">Vendas</TableHead>
                  <TableHead className="text-right">Receita</TableHead>
                  <TableHead className="text-right">Custo</TableHead>
                  <TableHead className="text-right">Lucro</TableHead>
                  <TableHead className="text-right">Margem</TableHead>
                  <TableHead className="text-right">Recebido</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {porVendedor.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-12">
                      Nenhuma venda com vendedor registrado em {ano}.
                    </TableCell>
                  </TableRow>
                ) : porVendedor.map((v) => (
                  <TableRow key={v.nome}>
                    <TableCell className="font-medium text-sm">{v.nome}</TableCell>
                    <TableCell className="text-right text-sm">{v.numVendas}</TableCell>
                    <TableCell className="text-right text-sm font-medium">{fmtBRL(v.receita)}</TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">{fmtBRL(v.custo)}</TableCell>
                    <TableCell className={`text-right text-sm font-semibold ${v.lucro >= 0 ? "text-success" : "text-destructive"}`}>
                      {fmtBRL(v.lucro)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={v.margem >= 20 ? "default" : "secondary"} className="text-[11px]">
                        {fmtPct(v.margem)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-sm text-success">{fmtBRL(v.recebido)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* ── Por Produto ──────────────────────────────────────── */}
        <TabsContent value="produtos">
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-muted-foreground">Top 30 produtos em {ano}</p>
            <Button size="sm" variant="outline" onClick={exportarProdutos}>
              <Download className="h-3.5 w-3.5 mr-1.5" />Exportar CSV
            </Button>
          </div>
          <div className="glass-card rounded-xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Unidades</TableHead>
                  <TableHead className="text-right">Receita</TableHead>
                  <TableHead className="text-right">Custo</TableHead>
                  <TableHead className="text-right">Lucro</TableHead>
                  <TableHead className="text-right">Margem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {porProduto.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-12">
                      Nenhuma venda em {ano}.
                    </TableCell>
                  </TableRow>
                ) : porProduto.map((p, i) => (
                  <TableRow key={p.nome}>
                    <TableCell className="text-muted-foreground text-sm">{i + 1}</TableCell>
                    <TableCell className="font-medium text-sm">{p.nome}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[11px] ${p.tipo === "perfume" ? "text-indigo-500 border-indigo-200" : "text-sky-500 border-sky-200"}`}>
                        {p.tipo === "perfume" ? "Perfume" : "Eletrônico"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-sm">{p.unidades}</TableCell>
                    <TableCell className="text-right text-sm font-medium">{fmtBRL(p.receita)}</TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">{fmtBRL(p.custo)}</TableCell>
                    <TableCell className={`text-right text-sm font-semibold ${p.lucro >= 0 ? "text-success" : "text-destructive"}`}>
                      {fmtBRL(p.lucro)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={p.margem >= 20 ? "default" : "secondary"} className="text-[11px]">
                        {fmtPct(p.margem)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}