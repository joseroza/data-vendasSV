import { useMemo, useState } from "react";
import { useApp, useCobrancas } from "@/context/AppContext";
import type { Venda } from "@/context/AppContext";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line,
} from "recharts";
import {
  TrendingUp, TrendingDown, ShoppingBag, DollarSign, AlertTriangle,
  CheckCircle2, Clock, ArrowUpRight, ChevronDown, Droplets, Smartphone,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "react-router-dom";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function fmtK(v: number) {
  if (Math.abs(v) >= 1000) return `R$${(v / 1000).toFixed(1)}k`;
  return fmtBRL(v);
}
function parseData(s: string): Date {
  const p = s.split("/");
  if (p.length === 3) return new Date(+p[2], +p[1] - 1, +p[0]);
  return new Date(s);
}
function getValor(v: Venda) {
  return v.tipo === "perfume" ? v.valorFinal : v.precoVenda;
}
function getLucro(v: Venda) {
  return v.tipo === "perfume" ? v.valorFinal - v.precoBrl : v.lucro;
}
function calcRecebido(v: Venda): number {
  const total = getValor(v);
  const entrada = v.valorEntrada ?? 0;
  if (v.tipoPagamento === "parcelado" && v.parcelas.length > 0) {
    const normais = v.parcelas.filter((p) => p.numero > 0);
    const valorParc = normais.length > 0 ? (total - entrada) / normais.length : 0;
    return v.parcelas.reduce((s, p) => {
      if (p.status !== "pago") return s;
      return s + (p.valorPago && p.valorPago > 0 ? p.valorPago : p.numero === 0 ? entrada : valorParc);
    }, 0);
  }
  return v.status === "pago" ? total : 0;
}

const MESES = [
  { label: "Janeiro",   short: "Jan", num: 1,  value: "01" },
  { label: "Fevereiro", short: "Fev", num: 2,  value: "02" },
  { label: "Março",     short: "Mar", num: 3,  value: "03" },
  { label: "Abril",     short: "Abr", num: 4,  value: "04" },
  { label: "Maio",      short: "Mai", num: 5,  value: "05" },
  { label: "Junho",     short: "Jun", num: 6,  value: "06" },
  { label: "Julho",     short: "Jul", num: 7,  value: "07" },
  { label: "Agosto",    short: "Ago", num: 8,  value: "08" },
  { label: "Setembro",  short: "Set", num: 9,  value: "09" },
  { label: "Outubro",   short: "Out", num: 10, value: "10" },
  { label: "Novembro",  short: "Nov", num: 11, value: "11" },
  { label: "Dezembro",  short: "Dez", num: 12, value: "12" },
];

const hoje = new Date();
const mesAtualValue = String(hoje.getMonth() + 1).padStart(2, "0");
const anoAtual = hoje.getFullYear();

// ─── Tooltip customizado ──────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl p-3 shadow-lg text-xs space-y-1">
      <p className="font-semibold text-foreground mb-1">{label}</p>
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

// ─── KPI Card ─────────────────────────────────────────────────────────────────

interface KpiProps {
  label: string;
  value: string;
  sub?: string;
  delta?: number;
  icon: React.ElementType;
  accent: string;
}

function KpiCard({ label, value, sub, delta, icon: Icon, accent }: KpiProps) {
  const up = delta !== undefined && delta >= 0;
  return (
    <div className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: accent + "20" }}>
          <Icon className="w-4 h-4" style={{ color: accent }} />
        </div>
      </div>
      <div>
        <p className="text-2xl font-bold tracking-tight text-foreground">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
      {delta !== undefined && (
        <div className={`flex items-center gap-1 text-xs font-medium ${up ? "text-emerald-500" : "text-rose-500"}`}>
          {up ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
          <span>{Math.abs(delta).toFixed(1)}% em relação ao mês anterior</span>
        </div>
      )}
    </div>
  );
}

// ─── Badge status ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  if (status === "pago")
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"><CheckCircle2 className="w-3 h-3" />Pago</span>;
  if (status === "atrasado")
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-rose-500/10 text-rose-500"><AlertTriangle className="w-3 h-3" />Atrasado</span>;
  return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400"><Clock className="w-3 h-3" />Pendente</span>;
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { state } = useApp();
  const cobrancas = useCobrancas();
  const [mes, setMes] = useState(mesAtualValue);
  const [vendedorFiltro, setVendedorFiltro] = useState("todos");

  const mesNum = MESES.find((m) => m.value === mes)?.num ?? hoje.getMonth() + 1;
  const mesLabel = MESES.find((m) => m.value === mes)?.label ?? "";

  // Vendedores únicos
  const vendedoresNomes = useMemo(() => {
    const s = new Set<string>();
    for (const v of state.vendas) { if (v.vendedor?.trim()) s.add(v.vendedor.trim()); }
    for (const v of state.vendedores ?? []) { if (v.nome?.trim()) s.add(v.nome.trim()); }
    return Array.from(s).sort();
  }, [state.vendas, state.vendedores]);

  const vendasFiltradas = useMemo(() =>
    vendedorFiltro === "todos" ? state.vendas
      : state.vendas.filter((v) => (v.vendedor ?? "").trim() === vendedorFiltro),
    [state.vendas, vendedorFiltro]);

  // ── KPIs gerais ───────────────────────────────────────────────────
  const stats = useMemo(() => {
    let fatTotal = 0, fatMes = 0, fatMesAnt = 0;
    let lucroTotal = 0, lucroMes = 0, lucroMesAnt = 0;
    let recebido = 0, pendente = 0;
    let numTotal = 0, numMes = 0, numPagas = 0;
    let perfFat = 0, eletFat = 0;

    const mesAnt = mesNum === 1 ? 12 : mesNum - 1;
    const anoMesAnt = mesNum === 1 ? anoAtual - 1 : anoAtual;

    for (const v of vendasFiltradas) {
      const dt = parseData(v.data);
      const val = getValor(v);
      const lucro = getLucro(v);
      const rec = calcRecebido(v);

      fatTotal += val;
      lucroTotal += lucro;
      recebido += rec;
      pendente += Math.max(0, val - rec);
      numTotal++;
      if (v.status === "pago") numPagas++;
      if (v.tipo === "perfume") perfFat += val; else eletFat += val;

      if (dt.getMonth() + 1 === mesNum && dt.getFullYear() === anoAtual) {
        fatMes += val; lucroMes += lucro; numMes++;
      }
      if (dt.getMonth() + 1 === mesAnt && dt.getFullYear() === anoMesAnt) {
        fatMesAnt += val; lucroMesAnt += lucro;
      }
    }

    const deltaFat  = fatMesAnt > 0 ? ((fatMes - fatMesAnt) / fatMesAnt) * 100 : undefined;
    const deltaLucro = lucroMesAnt > 0 ? ((lucroMes - lucroMesAnt) / lucroMesAnt) * 100 : undefined;

    return {
      fatTotal, fatMes, lucroTotal, lucroMes,
      recebido, pendente, numTotal, numMes, numPagas,
      perfFat, eletFat, deltaFat, deltaLucro,
      ticketMedio: numMes > 0 ? fatMes / numMes : 0,
      txRecebimento: fatTotal > 0 ? (recebido / fatTotal) * 100 : 0,
    };
  }, [vendasFiltradas, mesNum]);

  // ── Gráfico — últimos 6 meses ─────────────────────────────────────
  const dadosGrafico = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(hoje.getFullYear(), hoje.getMonth() - (5 - i), 1);
      const m = d.getMonth() + 1, y = d.getFullYear();
      let perfumes = 0, eletronicos = 0, lucro = 0;
      for (const v of vendasFiltradas) {
        const vd = parseData(v.data);
        if (vd.getMonth() + 1 === m && vd.getFullYear() === y) {
          if (v.tipo === "perfume") perfumes += v.valorFinal;
          else eletronicos += v.precoVenda;
          lucro += getLucro(v);
        }
      }
      return { mes: MESES[d.getMonth()].short, Perfumes: +perfumes.toFixed(2), Eletrônicos: +eletronicos.toFixed(2), Lucro: +lucro.toFixed(2) };
    });
  }, [vendasFiltradas]);

  // ── Distribuição por categoria ────────────────────────────────────
  const totalCats = stats.perfFat + stats.eletFat || 1;
  const pctPerf = (stats.perfFat / totalCats) * 100;
  const pctElet = (stats.eletFat / totalCats) * 100;

  // ── Vendas recentes ───────────────────────────────────────────────
  const recentes = useMemo(() =>
    [...vendasFiltradas]
      .sort((a, b) => parseData(b.data).getTime() - parseData(a.data).getTime())
      .slice(0, 8),
    [vendasFiltradas]);

  // ── Cobranças pendentes próximas ──────────────────────────────────
  const proximasCobr = useMemo(() =>
    cobrancas
      .filter((c) => c.status !== "pago")
      .sort((a, b) => {
        const pa = a.vencimento.split("/"); const pb = b.vencimento.split("/");
        return new Date(+pa[2], +pa[1]-1, +pa[0]).getTime() - new Date(+pb[2], +pb[1]-1, +pb[0]).getTime();
      })
      .slice(0, 5),
    [cobrancas]);

  const nomeProduto = (v: Venda) => {
    const raw = v.tipo === "perfume" ? v.perfume : v.produto;
    const seg = raw.split(",")[0].trim();
    const pi = seg.indexOf("|");
    return pi !== -1 ? seg.slice(pi + 1).trim() : seg;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Visão geral das suas vendas</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Filtro vendedor */}
          {vendedoresNomes.length > 0 && (
            <Select value={vendedorFiltro} onValueChange={setVendedorFiltro}>
              <SelectTrigger className="h-9 w-40 text-xs border-border rounded-xl bg-card">
                <SelectValue placeholder="Vendedor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                {vendedoresNomes.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          {/* Filtro mês */}
          <Select value={mes} onValueChange={setMes}>
            <SelectTrigger className="h-9 w-36 text-xs border-border rounded-xl bg-card">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MESES.map((m) => (
                <SelectItem key={m.value} value={m.value}>{m.label} {anoAtual}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── KPI Cards ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard
          label="Faturamento do Mês"
          value={fmtBRL(stats.fatMes)}
          sub={`${stats.numMes} venda(s) em ${mesLabel}`}
          delta={stats.deltaFat}
          icon={DollarSign}
          accent="#6366f1"
        />
        <KpiCard
          label="Lucro do Mês"
          value={fmtBRL(stats.lucroMes)}
          sub={stats.fatMes > 0 ? `Margem: ${((stats.lucroMes / stats.fatMes) * 100).toFixed(1)}%` : undefined}
          delta={stats.deltaLucro}
          icon={TrendingUp}
          accent="#10b981"
        />
        <KpiCard
          label="Total Recebido"
          value={fmtBRL(stats.recebido)}
          sub={`${stats.txRecebimento.toFixed(0)}% do faturado`}
          icon={CheckCircle2}
          accent="#3b82f6"
        />
        <KpiCard
          label="A Receber"
          value={fmtBRL(stats.pendente)}
          sub={`${proximasCobr.length} parcela(s) pendente(s)`}
          icon={Clock}
          accent="#f59e0b"
        />
      </div>

      {/* ── Linha central: Gráfico + Distribuição ───────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">

        {/* Gráfico de barras — ocupa 2 colunas */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-sm font-semibold text-foreground">Visão Geral de Vendas</p>
              <p className="text-xs text-muted-foreground mt-0.5">Últimos 6 meses</p>
            </div>
            <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-indigo-500 inline-block"/> Perfumes</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-sky-400 inline-block"/> Eletrônicos</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-400 inline-block"/> Lucro</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={dadosGrafico} barGap={4} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickFormatter={fmtK} axisLine={false} tickLine={false} width={55} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--muted)", opacity: 0.5, radius: 4 }} />
              <Bar dataKey="Perfumes"    fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={24} />
              <Bar dataKey="Eletrônicos" fill="#38bdf8" radius={[4, 4, 0, 0]} maxBarSize={24} />
              <Bar dataKey="Lucro"       fill="#34d399" radius={[4, 4, 0, 0]} maxBarSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Distribuição por categoria */}
        <div className="bg-card border border-border rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">Distribuição</p>
            <p className="text-xs text-muted-foreground mt-0.5">Por categoria (geral)</p>
          </div>

          {/* Total geral */}
          <div className="text-center py-4">
            <p className="text-3xl font-bold tracking-tight">{fmtBRL(stats.fatTotal)}</p>
            <p className="text-xs text-muted-foreground mt-1">Faturamento total</p>
          </div>

          {/* Barras de categoria */}
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="flex items-center gap-1.5 font-medium"><Droplets className="w-3.5 h-3.5 text-indigo-500"/> Perfumes</span>
                <span className="text-muted-foreground">{fmtK(stats.perfFat)} · {pctPerf.toFixed(0)}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full transition-all duration-700" style={{ width: `${pctPerf}%` }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="flex items-center gap-1.5 font-medium"><Smartphone className="w-3.5 h-3.5 text-sky-400"/> Eletrônicos</span>
                <span className="text-muted-foreground">{fmtK(stats.eletFat)} · {pctElet.toFixed(0)}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-sky-400 rounded-full transition-all duration-700" style={{ width: `${pctElet}%` }} />
              </div>
            </div>

            {/* Mini stats */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
              <div className="bg-muted/40 rounded-xl p-3">
                <p className="text-[10px] text-muted-foreground">Ticket médio</p>
                <p className="text-sm font-bold mt-0.5">{stats.numMes > 0 ? fmtBRL(stats.ticketMedio) : "—"}</p>
              </div>
              <div className="bg-muted/40 rounded-xl p-3">
                <p className="text-[10px] text-muted-foreground">Vendas pagas</p>
                <p className="text-sm font-bold mt-0.5">{stats.numPagas}/{stats.numTotal}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Linha inferior: Recentes + Cobranças ────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Vendas recentes — 2 colunas */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <div>
              <p className="text-sm font-semibold text-foreground">Vendas Recentes</p>
              <p className="text-xs text-muted-foreground mt-0.5">Últimas {recentes.length} transações</p>
            </div>
            <Link to="/perfumes/vendas" className="text-xs text-primary hover:underline flex items-center gap-1">
              Ver todas <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="divide-y divide-border">
            {recentes.length === 0 ? (
              <div className="px-6 py-12 text-center text-sm text-muted-foreground">
                Nenhuma venda registrada ainda.
              </div>
            ) : recentes.map((v) => {
              const val = getValor(v);
              const rec = calcRecebido(v);
              const pct = val > 0 ? Math.min(100, (rec / val) * 100) : 0;
              return (
                <div key={v.id} className="px-6 py-3.5 flex items-center gap-4 hover:bg-muted/30 transition-colors">
                  {/* Ícone tipo */}
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${v.tipo === "perfume" ? "bg-indigo-500/10" : "bg-sky-400/10"}`}>
                    {v.tipo === "perfume"
                      ? <Droplets className="w-4 h-4 text-indigo-500" />
                      : <Smartphone className="w-4 h-4 text-sky-400" />}
                  </div>

                  {/* Cliente + produto */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{v.cliente}</p>
                    <p className="text-xs text-muted-foreground truncate">{nomeProduto(v)}</p>
                  </div>

                  {/* Barra de recebimento */}
                  <div className="w-20 hidden sm:block">
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, background: pct === 100 ? "#10b981" : "#f59e0b" }}
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5 text-right">{pct.toFixed(0)}%</p>
                  </div>

                  {/* Data */}
                  <p className="text-xs text-muted-foreground w-20 text-right hidden md:block">{v.data}</p>

                  {/* Valor + status */}
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-foreground">{fmtBRL(val)}</p>
                    <StatusBadge status={v.status} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Próximas cobranças */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <div>
              <p className="text-sm font-semibold text-foreground">Cobranças Pendentes</p>
              <p className="text-xs text-muted-foreground mt-0.5">{cobrancas.filter(c => c.status !== "pago").length} parcela(s)</p>
            </div>
            <Link to="/cobrancas" className="text-xs text-primary hover:underline flex items-center gap-1">
              Ver todas <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="divide-y divide-border">
            {proximasCobr.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Tudo em dia!</p>
              </div>
            ) : proximasCobr.map((c, i) => {
              const [d, m] = c.vencimento.split("/");
              const venc = new Date(+c.vencimento.split("/")[2], +m - 1, +d);
              const atrasada = venc < hoje;
              return (
                <div key={i} className="px-5 py-3.5 flex items-center gap-3 hover:bg-muted/30 transition-colors">
                  {/* Data pill */}
                  <div className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center shrink-0 ${atrasada ? "bg-rose-500/10" : "bg-amber-500/10"}`}>
                    <span className={`text-[10px] font-bold leading-none ${atrasada ? "text-rose-500" : "text-amber-600"}`}>{d}</span>
                    <span className={`text-[9px] leading-none mt-0.5 ${atrasada ? "text-rose-400" : "text-amber-500"}`}>{MESES[+m - 1]?.short}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{c.cliente}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{c.parcela}</p>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold">{fmtBRL(c.valor)}</p>
                    {atrasada && <span className="text-[10px] text-rose-500">Atrasada</span>}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Resumo pendente */}
          {proximasCobr.length > 0 && (
            <div className="px-5 py-4 border-t border-border bg-muted/20">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Total pendente</span>
                <span className="font-semibold text-amber-600">
                  {fmtBRL(cobrancas.filter(c => c.status !== "pago").reduce((s, c) => s + c.valor, 0))}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}