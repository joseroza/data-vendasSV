import { KpiCard } from "@/components/KpiCard";
import {
  DollarSign, TrendingUp, Calendar, Clock, AlertTriangle,
  CheckCircle2, ArrowUpRight, Users
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useState } from "react";

const mockPendencias = [
  { cliente: "Maria Silva", valor: "R$ 450,00", parcela: "3/6", vencimento: "05/03/2026" },
  { cliente: "João Santos", valor: "R$ 280,00", parcela: "2/4", vencimento: "05/03/2026" },
  { cliente: "Ana Costa", valor: "R$ 620,00", parcela: "1/3", vencimento: "05/03/2026" },
  { cliente: "Carlos Lima", valor: "R$ 180,00", parcela: "4/5", vencimento: "05/03/2026" },
];

const mockVendasRecentes = [
  { cliente: "Pedro Alves", produto: "Sauvage Dior", tipo: "perfume", valor: "R$ 890,00", data: "03/03/2026" },
  { cliente: "Lucia Ferreira", produto: "iPhone 15 Pro", tipo: "eletronico", valor: "R$ 7.200,00", data: "02/03/2026" },
  { cliente: "Roberto Dias", produto: "Bleu de Chanel", tipo: "perfume", valor: "R$ 720,00", data: "01/03/2026" },
  { cliente: "Fernanda Reis", produto: "Samsung S24", tipo: "eletronico", valor: "R$ 4.500,00", data: "28/02/2026" },
];

export default function Dashboard() {
  const [mes, setMes] = useState("marco");

  return (
    <div className="space-y-6 max-w-7xl">
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
            <SelectItem value="janeiro">Janeiro</SelectItem>
            <SelectItem value="fevereiro">Fevereiro</SelectItem>
            <SelectItem value="marco">Março</SelectItem>
            <SelectItem value="abril">Abril</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Venda Total" value="R$ 48.350,00" subtitle="Acumulado geral" icon={DollarSign} />
        <KpiCard title="Venda Mensal" value="R$ 12.890,00" subtitle="Março 2026" icon={TrendingUp} />
        <KpiCard title="Venda Semanal" value="R$ 3.420,00" subtitle="Semana atual" icon={Calendar} />
        <KpiCard title="Venda Diária" value="R$ 890,00" subtitle="Hoje" icon={ArrowUpRight} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <KpiCard title="Total a Receber" value="R$ 8.230,00" icon={Clock} variant="warning" />
        <KpiCard title="Total Recebido" value="R$ 40.120,00" icon={CheckCircle2} variant="success" />
        <KpiCard title="Total Pendente" value="R$ 3.450,00" subtitle="12 parcelas" icon={AlertTriangle} variant="destructive" />
      </div>

      {/* Pendencias + Vendas Recentes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pendências */}
        <div className="glass-card rounded-xl p-5 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Pendências / Cobranças
            </h2>
            <Badge variant="destructive" className="text-xs">
              {mockPendencias.length} pendentes
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Total a receber este mês: <span className="font-semibold text-foreground">R$ 1.530,00</span>
          </p>
          <div className="space-y-3">
            {mockPendencias.map((p, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border/50">
                <div>
                  <p className="font-medium text-sm">{p.cliente}</p>
                  <p className="text-xs text-muted-foreground">Parcela {p.parcela} · Venc: {p.vencimento}</p>
                </div>
                <span className="font-semibold text-sm">{p.valor}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Vendas Recentes */}
        <div className="glass-card rounded-xl p-5 animate-fade-in">
          <h2 className="section-title mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Vendas Recentes
          </h2>
          <div className="space-y-3">
            {mockVendasRecentes.map((v, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border/50">
                <div className="flex items-center gap-3">
                  <Badge variant={v.tipo === "perfume" ? "default" : "secondary"} className="text-xs">
                    {v.tipo === "perfume" ? "🧴" : "📱"}
                  </Badge>
                  <div>
                    <p className="font-medium text-sm">{v.cliente}</p>
                    <p className="text-xs text-muted-foreground">{v.produto} · {v.data}</p>
                  </div>
                </div>
                <span className="font-semibold text-sm">{v.valor}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
