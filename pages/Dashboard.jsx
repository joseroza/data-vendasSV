import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { DollarSign, TrendingUp, ShoppingBag, Package, AlertCircle, Percent } from "lucide-react";
import StatCard from "@/components/dashboard/StatCard";
import RecentSales from "@/components/dashboard/RecentSales";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from "recharts";

export default function Dashboard() {
  const { data: vendasPerfumes = [] } = useQuery({
    queryKey: ['vendas-perfumes'],
    queryFn: () => base44.entities.VendaPerfume.list('-data_venda')
  });
  const { data: vendasEletronicos = [] } = useQuery({
    queryKey: ['vendas-eletronicos'],
    queryFn: () => base44.entities.VendaEletronico.list('-data_venda')
  });
  const { data: estoque = [] } = useQuery({
    queryKey: ['estoque'],
    queryFn: () => base44.entities.EstoquePerfume.list()
  });

  const totalVendasPerfumes = vendasPerfumes.reduce((acc, v) => acc + (v.preco_venda || 0), 0);
  const totalVendasEletronicos = vendasEletronicos.reduce((acc, v) => acc + (v.preco_venda || 0), 0);
  const totalVendas = totalVendasPerfumes + totalVendasEletronicos;
  const lucroTotal = vendasPerfumes.reduce((acc, v) => acc + (v.lucro_liquido || 0), 0);
  const custoTotal = vendasPerfumes.reduce((acc, v) => acc + (v.custo_reais || 0), 0);

  // CORRIGIDO: valorPendente usa preco_venda quando valor_faltante é 0
  const todasPendentes = [
    ...vendasPerfumes.filter(v => v.status_pagamento !== 'PAGO'),
    ...vendasEletronicos.filter(v => v.status_pagamento !== 'PAGO'),
  ];
  const valorPendente = todasPendentes.reduce((acc, v) => {
    const faltante = (v.valor_faltante > 0) ? v.valor_faltante : (v.preco_venda || 0);
    return acc + faltante;
  }, 0);

  const itensEstoque = estoque.reduce((acc, e) => acc + (e.quantidade || 0), 0);
  const margemLucro = custoTotal > 0 ? ((lucroTotal / custoTotal) * 100).toFixed(1) : 0;

  const statusData = [
    { name: 'Pagos', value: vendasPerfumes.filter(v => v.status_pagamento === 'PAGO').length, color: '#10B981' },
    { name: 'Pendentes', value: vendasPerfumes.filter(v => v.status_pagamento === 'PENDENTE').length, color: '#F59E0B' },
    { name: 'Parcial', value: vendasPerfumes.filter(v => v.status_pagamento === 'PARCIAL').length, color: '#3B82F6' }
  ];

  const marcasData = vendasPerfumes.reduce((acc, v) => {
    const existing = acc.find(a => a.marca === v.marca);
    if (existing) { existing.quantidade++; existing.valor += v.preco_venda || 0; }
    else if (v.marca) { acc.push({ marca: v.marca, quantidade: 1, valor: v.preco_venda || 0 }); }
    return acc;
  }, []).sort((a, b) => b.quantidade - a.quantidade).slice(0, 5);

  const todasVendas = [...vendasPerfumes, ...vendasEletronicos].sort((a, b) =>
    new Date(b.data_venda || b.created_date) - new Date(a.data_venda || a.created_date)
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-pink-50/30 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Dashboard</h1>
            <p className="text-gray-500 mt-1">Visão geral das suas vendas</p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <StatCard title="Total Vendas" value={`R$ ${totalVendas.toFixed(2)}`} icon={DollarSign} color="#8B5CF6" subtitle={`${vendasPerfumes.length + vendasEletronicos.length} vendas`} />
          <StatCard title="Lucro Total" value={`R$ ${lucroTotal.toFixed(2)}`} icon={TrendingUp} color="#10B981" subtitle="Perfumes" />
          <StatCard title="Custo Total" value={`R$ ${custoTotal.toFixed(2)}`} icon={ShoppingBag} color="#F59E0B" />
          <StatCard title="Margem" value={`${margemLucro}%`} icon={Percent} color="#3B82F6" />
          <StatCard title="Pendente" value={`R$ ${valorPendente.toFixed(2)}`} icon={AlertCircle} color="#EF4444" subtitle={`${todasPendentes.length} vendas`} />
          <StatCard title="Estoque" value={`${itensEstoque} itens`} icon={Package} color="#6366F1" subtitle={`${estoque.length} produtos`} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-5 border border-gray-100 shadow-sm">
            <h3 className="font-semibold text-gray-700 mb-4">Status de Pagamentos</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {statusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-5 border border-gray-100 shadow-sm lg:col-span-2">
            <h3 className="font-semibold text-gray-700 mb-4">Top Marcas</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={marcasData}>
                <XAxis dataKey="marca" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value, name) => [name === 'valor' ? `R$ ${value.toFixed(2)}` : value, name === 'valor' ? 'Valor' : 'Qtd']} />
                <Legend />
                <Bar dataKey="quantidade" fill="#8B5CF6" name="Quantidade" />
                <Bar dataKey="valor" fill="#10B981" name="Valor (R$)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-5 border border-gray-100 shadow-sm">
          <h3 className="font-semibold text-gray-700 mb-4">Vendas Recentes</h3>
          <RecentSales vendas={todasVendas.slice(0, 10)} />
        </div>
      </div>
    </div>
  );
}
