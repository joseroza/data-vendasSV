import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const PLATAFORMAS = ["INFINITE PAY", "C6", "NUBANK", "PICPAY", "MERCADO PAGO"];

const EMPTY = {
  data_venda: new Date().toISOString().split('T')[0],
  comprador: "",
  nome_perfume: "",
  marca: "",
  preco_dolar: "",
  cotacao_dolar: "5.60",
  custo_reais: 0,
  preco_venda: "",
  lucro_bruto: 0,
  lucro_liquido: 0,
  status_pagamento: "PENDENTE",
  forma_pagamento: "PIX/À VISTA",
  plataforma: "",
  parcela_1: "",
  parcela_2: "",
  parcela_3: "",
  valor_faltante: 0,
};

function calcular(f) {
  const custo = (parseFloat(f.preco_dolar) || 0) * (parseFloat(f.cotacao_dolar) || 0) * 1.2;
  const venda = parseFloat(f.preco_venda) || 0;
  const lucro = venda - custo;
  const p1 = parseFloat(f.parcela_1) || 0;
  const p2 = parseFloat(f.parcela_2) || 0;
  const p3 = parseFloat(f.parcela_3) || 0;
  const faltante = venda - (p1 + p2 + p3);
  return {
    custo_reais: custo,
    lucro_bruto: lucro,
    lucro_liquido: lucro,
    valor_faltante: faltante > 0 ? faltante : 0,
  };
}

export default function NovaVenda() {
  const [form, setForm] = useState({ ...EMPTY });
  const [saved, setSaved] = useState(false);
  const queryClient = useQueryClient();

  const { data: estoque = [] } = useQuery({
    queryKey: ['estoque'],
    queryFn: () => base44.entities.EstoquePerfume.list('perfume'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.VendaPerfume.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendas-perfumes'] });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      setForm({ ...EMPTY });
    },
  });

  // Recalcular automático
  const calc = calcular(form);

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handlePerfumeSelect = (nome) => {
    const p = estoque.find(e => e.perfume === nome);
    if (p) {
      setForm(prev => ({
        ...prev,
        nome_perfume: p.perfume,
        marca: p.marca || prev.marca,
        preco_dolar: p.preco_dolar?.toString() || prev.preco_dolar,
        preco_venda: p.preco_venda?.toString() || prev.preco_venda,
      }));
    } else {
      set('nome_perfume', nome);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate({ ...form, ...calc });
  };

  const marcasUnicas = [...new Set(estoque.map(p => p.marca).filter(Boolean))];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-pink-50/30 p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Nova Venda de Perfume
          </h1>
          <p className="text-gray-500 mt-1">Preencha os dados da venda abaixo</p>
        </motion.div>

        {/* Sucesso */}
        <AnimatePresence>
          {saved && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-6 flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span className="font-medium">Venda registrada com sucesso!</span>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">

            {/* Bloco 1: Identificação */}
            <div className="bg-white/90 rounded-2xl border border-gray-100 shadow p-6 space-y-4">
              <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wider border-b pb-2">Identificação</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Data da Venda <span className="text-red-400">*</span></Label>
                  <Input type="date" value={form.data_venda} onChange={e => set('data_venda', e.target.value)} required />
                </div>
                <div className="space-y-1">
                  <Label>Comprador <span className="text-red-400">*</span></Label>
                  <Input value={form.comprador} onChange={e => set('comprador', e.target.value)} placeholder="Nome do comprador" required />
                </div>
              </div>
            </div>

            {/* Bloco 2: Produto */}
            <div className="bg-white/90 rounded-2xl border border-gray-100 shadow p-6 space-y-4">
              <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wider border-b pb-2">Produto</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Nome do Perfume <span className="text-red-400">*</span></Label>
                  <Select value={form.nome_perfume} onValueChange={handlePerfumeSelect}>
                    <SelectTrigger><SelectValue placeholder="Selecione do estoque..." /></SelectTrigger>
                    <SelectContent>
                      {estoque.map(p => (
                        <SelectItem key={p.id} value={p.perfume}>{p.perfume}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    className="mt-1"
                    value={form.nome_perfume}
                    onChange={e => set('nome_perfume', e.target.value)}
                    placeholder="Ou digite manualmente"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Marca</Label>
                  <Select value={form.marca} onValueChange={v => set('marca', v)}>
                    <SelectTrigger><SelectValue placeholder="Selecione a marca" /></SelectTrigger>
                    <SelectContent>
                      {marcasUnicas.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                      <SelectItem value="AL WATANIAH">AL WATANIAH</SelectItem>
                      <SelectItem value="LATAFFA">LATAFFA</SelectItem>
                      <SelectItem value="ARMAF">ARMAF</SelectItem>
                      <SelectItem value="LATTAFA PRIDE">LATTAFA PRIDE</SelectItem>
                      <SelectItem value="AL HARAMAIN">AL HARAMAIN</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Bloco 3: Precificação */}
            <div className="bg-white/90 rounded-2xl border border-gray-100 shadow p-6 space-y-4">
              <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wider border-b pb-2">Precificação</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label>Preço em Dólar (USD)</Label>
                  <Input type="number" step="0.01" value={form.preco_dolar} onChange={e => set('preco_dolar', e.target.value)} placeholder="0.00" />
                </div>
                <div className="space-y-1">
                  <Label>Cotação do Dólar (R$)</Label>
                  <Input type="number" step="0.01" value={form.cotacao_dolar} onChange={e => set('cotacao_dolar', e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Custo em Reais +20%</Label>
                  <Input value={calc.custo_reais.toFixed(2)} disabled className="bg-orange-50 text-orange-700 font-medium" />
                </div>
                <div className="space-y-1">
                  <Label>Preço de Venda (R$) <span className="text-red-400">*</span></Label>
                  <Input type="number" step="0.01" value={form.preco_venda} onChange={e => set('preco_venda', e.target.value)} placeholder="0.00" required />
                </div>
                <div className="space-y-1">
                  <Label>Lucro Bruto (R$)</Label>
                  <Input value={calc.lucro_bruto.toFixed(2)} disabled className={`font-semibold ${calc.lucro_bruto >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`} />
                </div>
                <div className="space-y-1">
                  <Label>Lucro Líquido (R$)</Label>
                  <Input value={calc.lucro_liquido.toFixed(2)} disabled className={`font-semibold ${calc.lucro_liquido >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`} />
                </div>
              </div>
            </div>

            {/* Bloco 4: Pagamento */}
            <div className="bg-white/90 rounded-2xl border border-gray-100 shadow p-6 space-y-4">
              <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wider border-b pb-2">Pagamento</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label>Status Pagamento</Label>
                  <Select value={form.status_pagamento} onValueChange={v => set('status_pagamento', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PAGO">PAGO</SelectItem>
                      <SelectItem value="PENDENTE">PENDENTE</SelectItem>
                      <SelectItem value="PARCIAL">PARCIAL</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Forma de Pagamento</Label>
                  <Select value={form.forma_pagamento} onValueChange={v => set('forma_pagamento', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PIX/À VISTA">PIX/À VISTA</SelectItem>
                      <SelectItem value="PIX PARCELADO">PIX PARCELADO</SelectItem>
                      <SelectItem value="CARTÃO">CARTÃO</SelectItem>
                      <SelectItem value="DINHEIRO">DINHEIRO</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Plataforma</Label>
                  <Select value={form.plataforma} onValueChange={v => set('plataforma', v)}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {PLATAFORMAS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Parcelas */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                <div className="space-y-1">
                  <Label>Parcela 1 (R$)</Label>
                  <Input type="number" step="0.01" value={form.parcela_1} onChange={e => set('parcela_1', e.target.value)} placeholder="0.00" />
                </div>
                <div className="space-y-1">
                  <Label>Parcela 2 (R$)</Label>
                  <Input type="number" step="0.01" value={form.parcela_2} onChange={e => set('parcela_2', e.target.value)} placeholder="0.00" />
                </div>
                <div className="space-y-1">
                  <Label>Parcela 3 (R$)</Label>
                  <Input type="number" step="0.01" value={form.parcela_3} onChange={e => set('parcela_3', e.target.value)} placeholder="0.00" />
                </div>
                <div className="space-y-1">
                  <Label>Faltante (R$)</Label>
                  <Input
                    value={calc.valor_faltante.toFixed(2)}
                    disabled
                    className={`font-semibold ${calc.valor_faltante > 0 ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}
                  />
                </div>
              </div>
            </div>

            {/* Botões */}
            <div className="flex gap-4 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setForm({ ...EMPTY })}
                className="gap-2"
              >
                <RefreshCw className="w-4 h-4" /> Limpar
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg px-8"
              >
                {createMutation.isPending ? "Salvando..." : "Registrar Venda"}
              </Button>
            </div>

          </div>
        </form>
      </div>
    </div>
  );
}