import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, RefreshCw, Plus, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const EMPTY = {
  data_venda: new Date().toISOString().split('T')[0],
  comprador: "",
  produto: "",
  marca: "",
  preco_venda: "",
  status_pagamento: "PENDENTE",
  forma_pagamento: "PIX PARCELADO",
  parcelas: [],
  valor_pago: 0,
  valor_faltante: 0,
};

export default function NovaVendaEletronico() {
  const [form, setForm] = useState({ ...EMPTY });
  const [saved, setSaved] = useState(false);
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.VendaEletronico.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendas-eletronicos'] });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      setForm({ ...EMPTY });
    },
  });

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const addParcela = () => {
    setForm(prev => ({
      ...prev,
      parcelas: [...prev.parcelas, { valor: "", data_vencimento: "", pago: false }]
    }));
  };

  const updateParcela = (index, field, value) => {
    const novas = [...form.parcelas];
    novas[index] = { ...novas[index], [field]: value };
    const totalPago = novas.reduce((acc, p) => p.pago ? acc + (parseFloat(p.valor) || 0) : acc, 0);
    setForm(prev => ({
      ...prev,
      parcelas: novas,
      valor_pago: totalPago,
      valor_faltante: Math.max(0, (parseFloat(prev.preco_venda) || 0) - totalPago),
    }));
  };

  const removeParcela = (index) => {
    const novas = form.parcelas.filter((_, i) => i !== index);
    const totalPago = novas.reduce((acc, p) => p.pago ? acc + (parseFloat(p.valor) || 0) : acc, 0);
    setForm(prev => ({
      ...prev,
      parcelas: novas,
      valor_pago: totalPago,
      valor_faltante: Math.max(0, (parseFloat(prev.preco_venda) || 0) - totalPago),
    }));
  };

  const recalcFaltante = (preco) => {
    const totalPago = form.parcelas.reduce((acc, p) => p.pago ? acc + (parseFloat(p.valor) || 0) : acc, 0);
    setForm(prev => ({
      ...prev,
      preco_venda: preco,
      valor_pago: totalPago,
      valor_faltante: Math.max(0, (parseFloat(preco) || 0) - totalPago),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate({ ...form, preco_venda: parseFloat(form.preco_venda) || 0 });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-cyan-50/30 p-6">
      <div className="max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
            Nova Venda de Eletrônico
          </h1>
          <p className="text-gray-500 mt-1">Preencha os dados da venda abaixo</p>
        </motion.div>

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

            {/* Identificação */}
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

            {/* Produto */}
            <div className="bg-white/90 rounded-2xl border border-gray-100 shadow p-6 space-y-4">
              <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wider border-b pb-2">Produto</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Produto <span className="text-red-400">*</span></Label>
                  <Input value={form.produto} onChange={e => set('produto', e.target.value)} placeholder="Ex: Galaxy Watch 7, AirPods..." required />
                </div>
                <div className="space-y-1">
                  <Label>Marca</Label>
                  <Input value={form.marca} onChange={e => set('marca', e.target.value)} placeholder="Ex: Samsung, Apple..." />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Preço de Venda (R$) <span className="text-red-400">*</span></Label>
                  <Input type="number" step="0.01" value={form.preco_venda} onChange={e => recalcFaltante(e.target.value)} placeholder="0.00" required />
                </div>
              </div>
            </div>

            {/* Pagamento */}
            <div className="bg-white/90 rounded-2xl border border-gray-100 shadow p-6 space-y-4">
              <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wider border-b pb-2">Pagamento</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              </div>

              {/* Parcelas */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-sm font-semibold text-gray-700">Parcelas</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addParcela} className="gap-1">
                    <Plus className="w-3 h-3" /> Adicionar Parcela
                  </Button>
                </div>
                <div className="space-y-2">
                  {form.parcelas.map((parcela, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <span className="text-xs text-gray-400 font-bold w-6">{index + 1}</span>
                      <div className="flex-1">
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Valor (R$)"
                          value={parcela.valor}
                          onChange={e => updateParcela(index, 'valor', e.target.value)}
                        />
                      </div>
                      <div className="flex-1">
                        <Input
                          type="date"
                          value={parcela.data_vencimento}
                          onChange={e => updateParcela(index, 'data_vencimento', e.target.value)}
                        />
                      </div>
                      <label className="flex items-center gap-2 text-sm text-gray-600 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={parcela.pago}
                          onChange={e => updateParcela(index, 'pago', e.target.checked)}
                          className="w-4 h-4 accent-emerald-600"
                        />
                        Pago
                      </label>
                      <button type="button" onClick={() => removeParcela(index)} className="text-red-400 hover:text-red-600 p-1">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Resumo */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-1">
                  <Label>Total Pago (R$)</Label>
                  <Input value={(form.valor_pago || 0).toFixed(2)} disabled className="bg-emerald-50 text-emerald-700 font-semibold" />
                </div>
                <div className="space-y-1">
                  <Label>Faltante (R$)</Label>
                  <Input value={(form.valor_faltante || 0).toFixed(2)} disabled className={`font-semibold ${form.valor_faltante > 0 ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`} />
                </div>
              </div>
            </div>

            {/* Botões */}
            <div className="flex gap-4 justify-end">
              <Button type="button" variant="outline" onClick={() => setForm({ ...EMPTY })} className="gap-2">
                <RefreshCw className="w-4 h-4" /> Limpar
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-lg px-8"
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