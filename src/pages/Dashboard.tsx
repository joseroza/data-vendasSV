import { KpiCard } from "@/components/KpiCard";
import {
  DollarSign, TrendingUp, Calendar, Clock, AlertTriangle,
  CheckCircle2, ArrowUpRight, Users, PackageOpen,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useState, useMemo } from "react";
import { useApp, useCobrancas } from "@/context/AppContext";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const MESES = [
  { value: "janeiro",   label: "Janeiro",   num: 1  },
  { value: "fevereiro", label: "Fevereiro", num: 2  },
  { value: "marco",     label: "Março",     num: 3  },
  { value: "abril",     label: "Abril",     num: 4  },
  { value: "maio",      label: "Maio",      num: 5  },
  { value: "junho",     label: "Junho",     num: 6  },
  { value: "julho",     label: "Julho",     num: 7  },
  { value: "agosto",    label: "Agosto",    num: 8  },
  { value: "setembro",  label: "Setembro",  num: 9  },
  { value: "outubro",   label: "Outubro",   num: 10 },
  { value: "novembro",  label: "Novembro",  num: 11 },
  { value: "dezembro",  label: "Dezembro",  num: 12 },
];

// Mês atual como padrão
const mesAtualValue = MESES[new Date().getMonth()].value;

function parseData(data: string): Date {
  const [d, m, y] = data.split("/");
  return new Date(+y, +m - 1, +d);
}

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// Calcula lucro de uma venda
function getLucro(venda: ReturnType<typeof Array.prototype.find> & any): number {
  if (venda.tipo === "perfume") {
    return venda.valorFinal - venda.precoBrl;           // venda - custo+margem
  } else {
    return venda.lucro ?? (venda.precoVenda - venda.precoCusto);
  }
}

// Calcula custo (valor bruto) de uma venda
function getCusto(venda: any): number {
  if (venda.tipo === "perfume") return venda.precoBrl ?? 0;
  return venda.precoCusto ?? 0;
}

export default function Dashboard() {
  const { state } = useApp();
  const cobrancas = useCobrancas();
  const [mes, setMes] = useState(mesAtualValue);

  const mesNum = MESES.find((m) => m.value === mes)?.num ?? new Date().getMonth() + 1;

  const stats = useMemo(() => {
    const hoje = new Date();

    let totalGeral    = 0;  // Preço de Venda bruto total
    let custoGeral    = 0;  // Custo+20% total
    let lucroGeral    = 0;  // Lucro = Venda - Custo+20%
    let totalMes      = 0;
    let custoMes      = 0;
    let lucroMes      = 0;
    let totalRecebido = 0;  // Soma das parcelas efetivamente pagas
    let totalAReceber = 0;  // Faltante = Venda - Recebido (apenas pendentes)
    let totalSemana   = 0;
    let totalHoje     = 0;

    for (const venda of state.vendas) {
      const data  = parseData(venda.data);
      const valor = venda.tipo === "perfume" ? venda.valorFinal : venda.precoVenda;
      const custo = getCusto(venda);
      const lucro = getLucro(venda);

      totalGeral += valor;
      custoGeral += custo;
      lucroGeral += lucro;

      if (data.getMonth() + 1 === mesNum && data.getFullYear() === hoje.getFullYear()) {
        totalMes += valor;
        custoMes += custo;
        lucroMes += lucro;
      }

      const diffDias = (hoje.getTime() - data.getTime()) / (1000 * 60 * 60 * 24);
      if (diffDias <= 7) totalSemana += valor;
      if (diffDias < 1)  totalHoje   += valor;

      // Recebido = soma das parcelas pagas (igual planilha: Parc1+Parc2+Parc3 pagas)
      // A Receber = Preço Venda - Recebido  (só se ainda tem faltante)
      if (venda.tipoPagamento === "parcelado" && venda.parcelas.length > 0) {
        const entradaVal   = (venda as any).valorEntrada || 0;
        const parcelasNorm = venda.parcelas.filter((p) => p.numero > 0);
        const valorParc    = parcelasNorm.length > 0 ? (valor - entradaVal) / parcelasNorm.length : 0;

        let recebidoVenda = 0;
        for (const p of venda.parcelas) {
          if (p.status === "pago") {
            recebidoVenda += p.numero === 0 ? entradaVal : valorParc;
          }
        }
        const faltante = valor - recebidoVenda;
        totalRecebido += recebidoVenda;
        if (faltante > 0) totalAReceber += faltante;
      } else {
        // À vista
        if (venda.status === "pago") {
          totalRecebido += valor;
        } else {
          totalAReceber += valor;
        }
      }
    }

    // Total Pendente = tudo que ainda não entrou no bolso
    const totalPendente = totalAReceber;

    return {
      totalGeral, custoGeral, lucroGeral,
      totalMes, custoMes, lucroMes,
      totalSemana, totalHoje,
      totalRecebido, totalAReceber, totalPendente,
    };
  }, [state.vendas, mesNum]);

  const vendasRecentes = useMemo(() => {
    return [...state.vendas]
      .sort((a, b) => parseData(b.data).getTime() - parseData(a.data).getTime())
      .slice(0, 5);
  }, [state.vendas]);

  const cobrancasRecentes = cobrancas.slice(0, 4);

  const mesLabel = MESES.find((m) => m.value === mes)?.label ?? mes;

  return (
    <div className="space-y-6 max-w-7xl">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Visão geral das suas vendas</p>
        </div>
        <Select value={mes} onValueChange={setMes}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar mês" />
          </SelectTrigger>
          <SelectContent>
            {MESES.map((m) => (
              <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* ── BLOCO 1: Totais gerais ───────────────────────────────────────── */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Acumulado Geral</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* Faturamento Total */}
          <div className="glass-card rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-primary" />
              </div>
              <p className="text-sm font-semibold">Faturamento Total</p>
            </div>
            <p className="text-2xl font-bold">{formatBRL(stats.totalGeral)}</p>
            <div className="pt-1 border-t border-border/50 text-xs text-muted-foreground flex justify-between">
              <span>Custo (bruto)</span>
              <span className="font-medium text-foreground">{formatBRL(stats.custoGeral)}</span>
            </div>
          </div>

          {/* Lucro Total */}
          <div className="glass-card rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-success" />
              </div>
              <p className="text-sm font-semibold">Lucro Total</p>
            </div>
            <p className={`text-2xl font-bold ${stats.lucroGeral >= 0 ? "text-success" : "text-destructive"}`}>
              {formatBRL(stats.lucroGeral)}
            </p>
            <div className="pt-1 border-t border-border/50 text-xs text-muted-foreground flex justify-between">
              <span>Margem</span>
              <span className="font-medium text-foreground">
                {stats.totalGeral > 0 ? ((stats.lucroGeral / stats.totalGeral) * 100).toFixed(1) : 0}%
              </span>
            </div>
          </div>

          {/* Recebido Total */}
          <div className="glass-card rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4 text-success" />
              </div>
              <p className="text-sm font-semibold">Total Recebido</p>
            </div>
            <p className="text-2xl font-bold text-success">{formatBRL(stats.totalRecebido)}</p>
            <div className="pt-1 border-t border-border/50 text-xs text-muted-foreground flex justify-between">
              <span>Custo (bruto)</span>
              <span className="font-medium text-foreground">{formatBRL(stats.custoGeral)}</span>
            </div>
          </div>

        </div>
      </div>

      {/* ── BLOCO 2: Mês selecionado ─────────────────────────────────────── */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">{mesLabel} {new Date().getFullYear()}</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          <div className="glass-card rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Calendar className="h-4 w-4 text-blue-500" />
              </div>
              <p className="text-sm font-semibold">Faturamento do Mês</p>
            </div>
            <p className="text-2xl font-bold">{formatBRL(stats.totalMes)}</p>
            <div className="pt-1 border-t border-border/50 text-xs text-muted-foreground flex justify-between">
              <span>Custo (bruto)</span>
              <span className="font-medium text-foreground">{formatBRL(stats.custoMes)}</span>
            </div>
          </div>

          <div className="glass-card rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-success" />
              </div>
              <p className="text-sm font-semibold">Lucro do Mês</p>
            </div>
            <p className={`text-2xl font-bold ${stats.lucroMes >= 0 ? "text-success" : "text-destructive"}`}>
              {formatBRL(stats.lucroMes)}
            </p>
            <div className="pt-1 border-t border-border/50 text-xs text-muted-foreground flex justify-between">
              <span>Margem</span>
              <span className="font-medium text-foreground">
                {stats.totalMes > 0 ? ((stats.lucroMes / stats.totalMes) * 100).toFixed(1) : 0}%
              </span>
            </div>
          </div>

          <div className="glass-card rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center">
                <Clock className="h-4 w-4 text-warning" />
              </div>
              <p className="text-sm font-semibold">A Receber (parcelas)</p>
            </div>
            <p className="text-2xl font-bold text-warning">{formatBRL(stats.totalAReceber)}</p>
            <div className="pt-1 border-t border-border/50 text-xs text-muted-foreground flex justify-between">
              <span>Parcelas pendentes</span>
              <span className="font-medium text-foreground">{cobrancas.length}</span>
            </div>
          </div>

        </div>
      </div>

      {/* ── BLOCO 3: Semana / Hoje / Pendente ───────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard title="Venda Semanal"   value={formatBRL(stats.totalSemana)}  subtitle="Últimos 7 dias"           icon={ArrowUpRight} />
        <KpiCard title="Venda Hoje"      value={formatBRL(stats.totalHoje)}    subtitle="Vendas do dia"            icon={Calendar} />
        <KpiCard title="Total Pendente"  value={formatBRL(stats.totalPendente)} subtitle="Vendas não recebidas"   icon={AlertTriangle} variant="destructive" />
      </div>

      {/* ── Pendências + Vendas Recentes ────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Pendências */}
        <div className="glass-card rounded-xl p-5 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Cobranças Pendentes
            </h2>
            <Badge variant="destructive" className="text-xs">
              {cobrancas.length} parcelas
            </Badge>
          </div>
          {cobrancasRecentes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhuma pendência! 🎉</p>
          ) : (
            <div className="space-y-2">
              {cobrancasRecentes.map((c, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border/50">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm">{c.cliente}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      Parcela {c.parcela} · Venc: {c.vencimento}
                    </p>
                  </div>
                  <span className="font-semibold text-sm ml-2 shrink-0">{formatBRL(c.valor)}</span>
                </div>
              ))}
            </div>
          )}
          {cobrancas.length > 4 && (
            <Button variant="ghost" size="sm" className="mt-3 w-full" asChild>
              <Link to="/cobrancas">Ver todas ({cobrancas.length})</Link>
            </Button>
          )}
        </div>

        {/* Vendas Recentes */}
        <div className="glass-card rounded-xl p-5 animate-fade-in">
          <h2 className="section-title mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Vendas Recentes
          </h2>
          <div className="space-y-2">
            {vendasRecentes.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhuma venda registrada.</p>
            ) : vendasRecentes.map((v) => {
              const valor  = v.tipo === "perfume" ? v.valorFinal : v.precoVenda;
              const custo  = getCusto(v);
              const lucro  = getLucro(v);
              const produto = v.tipo === "perfume"
                ? v.perfume.replace(/\|/g, " ").split(",")[0]
                : v.produto.replace(/\|/g, " ").split(",")[0];
              return (
                <div key={v.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border/50">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="text-base shrink-0">{v.tipo === "perfume" ? "🧴" : "📱"}</span>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{v.cliente}</p>
                      <p className="text-xs text-muted-foreground truncate">{produto} · {v.data}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <p className="font-semibold text-sm">{formatBRL(valor)}</p>
                    <p className="text-xs text-muted-foreground">bruto: {formatBRL(custo)}</p>
                    <p className={`text-xs font-medium ${lucro >= 0 ? "text-success" : "text-destructive"}`}>
                      lucro: {formatBRL(lucro)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}