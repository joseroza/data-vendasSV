import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Trash2, Pencil, Check, X } from "lucide-react";
import { motion } from "framer-motion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

const PLATAFORMAS = ["INFINITE PAY", "C6", "NUBANK", "PICPAY", "MERCADO PAGO"];

const EMPTY_ROW = {
  data_venda: new Date().toISOString().split('T')[0],
  comprador: "",
  nome_perfume: "",
  marca: "",
  preco_dolar: "",
  cotacao_dolar: 5.60,
  custo_reais: 0,
  preco_venda: "",
  lucro_bruto: 0,
  lucro_liquido: 0,
  repassar_joarez: 0,
  status_pagamento: "PENDENTE",
  forma_pagamento: "PIX/À VISTA",
  plataforma: "",
  parcela_1: "",
  parcela_2: "",
  parcela_3: "",
  valor_faltante: 0,
};

function calcular(row) {
  const custo = (parseFloat(row.preco_dolar) || 0) * (parseFloat(row.cotacao_dolar) || 0) * 1.2;
  const venda = parseFloat(row.preco_venda) || 0;
  const lucro = venda - custo;
  const p1 = parseFloat(row.parcela_1) || 0;
  const p2 = parseFloat(row.parcela_2) || 0;
  const p3 = parseFloat(row.parcela_3) || 0;
  const totalPago = p1 + p2 + p3;
  const faltante = venda - totalPago > 0 ? venda - totalPago : 0;
  return { custo_reais: custo, lucro_bruto: lucro, lucro_liquido: lucro, valor_faltante: faltante };
}

const statusColors = {
  PAGO: "bg-emerald-100 text-emerald-700 border-emerald-200",
  PENDENTE: "bg-amber-100 text-amber-700 border-amber-200",
  PARCIAL: "bg-blue-100 text-blue-700 border-blue-200"
};

// Célula editável inline
function EditCell({ value, onChange, type = "text", placeholder = "", width = "w-28", disabled = false, className = "" }) {
  return (
    <input
      type={type}
      value={value ?? ""}
      onChange={(e) => onChange(type === "number" ? e.target.value : e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className={`${width} px-2 py-1 text-sm border border-transparent rounded focus:border-purple-400 focus:outline-none focus:bg-white bg-transparent ${disabled ? "text-gray-500 cursor-not-allowed" : "hover:bg-white/60"} ${className}`}
      step={type === "number" ? "0.01" : undefined}
    />
  );
}

function SelectCell({ value, onChange, options, placeholder = "", width = "w-32" }) {
  return (
    <select
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      className={`${width} px-2 py-1 text-sm border border-transparent rounded focus:border-purple-400 focus:outline-none bg-transparent hover:bg-white/60 focus:bg-white`}
    >
      <option value="">{placeholder}</option>
      {options.map(o => (
        <option key={o.value || o} value={o.value || o}>{o.label || o}</option>
      ))}
    </select>
  );
}

export default function VendasPerfumes() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [newRow, setNewRow] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});

  const queryClient = useQueryClient();

  const { data: vendas = [] } = useQuery({
    queryKey: ['vendas-perfumes'],
    queryFn: () => base44.entities.VendaPerfume.list('-data_venda')
  });

  const { data: estoque = [] } = useQuery({
    queryKey: ['estoque'],
    queryFn: () => base44.entities.EstoquePerfume.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.VendaPerfume.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['vendas-perfumes'] }); setNewRow(null); }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.VendaPerfume.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['vendas-perfumes'] }); setEditingId(null); }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.VendaPerfume.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vendas-perfumes'] })
  });

  const updateNewRow = (field, value) => {
    setNewRow(prev => {
      const updated = { ...prev, [field]: value };
      const calc = calcular(updated);
      return { ...updated, ...calc };
    });
  };

  const updateEditData = (field, value) => {
    setEditData(prev => {
      const updated = { ...prev, [field]: value };
      const calc = calcular(updated);
      return { ...updated, ...calc };
    });
  };

  const handleSaveNew = () => {
    if (!newRow.comprador || !newRow.nome_perfume) return;
    const calc = calcular(newRow);
    createMutation.mutate({ ...newRow, ...calc });
  };

  const handleStartEdit = (venda) => {
    setEditingId(venda.id);
    setEditData({ ...venda });
  };

  const handleSaveEdit = () => {
    const calc = calcular(editData);
    updateMutation.mutate({ id: editingId, data: { ...editData, ...calc } });
  };

  const handleDelete = (id) => {
    if (confirm("Excluir esta venda?")) deleteMutation.mutate(id);
  };

  const handlePerfumeSelectNew = (nome) => {
    const p = estoque.find(e => e.perfume === nome);
    if (p) {
      setNewRow(prev => {
        const updated = { ...prev, nome_perfume: p.perfume, marca: p.marca, preco_dolar: p.preco_dolar || 0, preco_venda: p.preco_venda || 0 };
        return { ...updated, ...calcular(updated) };
      });
    } else {
      updateNewRow('nome_perfume', nome);
    }
  };

  const filteredVendas = vendas.filter(v => {
    const matchSearch =
      v.comprador?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.nome_perfume?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.marca?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === "all" || v.status_pagamento === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalVendas = filteredVendas.reduce((acc, v) => acc + (v.preco_venda || 0), 0);
  const totalLucro = filteredVendas.reduce((acc, v) => acc + (v.lucro_liquido || 0), 0);
  const totalPendente = filteredVendas.reduce((acc, v) => acc + (v.valor_faltante || 0), 0);

  const perfumeOptions = estoque.map(p => ({ value: p.perfume, label: `${p.perfume} (${p.marca})` }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-pink-50/30 p-4">
      <div className="max-w-full mx-auto space-y-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Controle de Venda Perfumes
            </h1>
            <p className="text-gray-500 mt-1">{filteredVendas.length} vendas registradas</p>
          </div>
          <Button
            onClick={() => setNewRow({ ...EMPTY_ROW })}
            disabled={!!newRow}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg"
          >
            <Plus className="w-4 h-4 mr-2" /> Nova Venda
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white/80 rounded-xl p-4 border border-gray-100">
            <p className="text-xs text-gray-500">Total Vendas</p>
            <p className="text-xl font-bold text-purple-600">R$ {totalVendas.toFixed(2)}</p>
          </div>
          <div className="bg-white/80 rounded-xl p-4 border border-gray-100">
            <p className="text-xs text-gray-500">Lucro Total</p>
            <p className="text-xl font-bold text-emerald-600">R$ {totalLucro.toFixed(2)}</p>
          </div>
          <div className="bg-white/80 rounded-xl p-4 border border-gray-100">
            <p className="text-xs text-gray-500">A Receber</p>
            <p className="text-xl font-bold text-amber-600">R$ {totalPendente.toFixed(2)}</p>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input placeholder="Buscar comprador, perfume, marca..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 bg-white/80" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48 bg-white/80"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              <SelectItem value="PAGO">Pagos</SelectItem>
              <SelectItem value="PENDENTE">Pendentes</SelectItem>
              <SelectItem value="PARCIAL">Parciais</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tabela estilo planilha */}
        <div className="bg-white/90 rounded-2xl border border-gray-200 shadow-lg overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-purple-50 border-b border-purple-100">
                <th className="px-3 py-3 text-left font-semibold text-purple-800 whitespace-nowrap">Data da Venda</th>
                <th className="px-3 py-3 text-left font-semibold text-purple-800 whitespace-nowrap">Comprador</th>
                <th className="px-3 py-3 text-left font-semibold text-purple-800 whitespace-nowrap">Nome do Perfume</th>
                <th className="px-3 py-3 text-left font-semibold text-purple-800 whitespace-nowrap">Marca</th>
                <th className="px-3 py-3 text-right font-semibold text-purple-800 whitespace-nowrap">Preço USD</th>
                <th className="px-3 py-3 text-right font-semibold text-purple-800 whitespace-nowrap">Cotação R$</th>
                <th className="px-3 py-3 text-right font-semibold text-purple-800 whitespace-nowrap bg-orange-50">Custo +20%</th>
                <th className="px-3 py-3 text-right font-semibold text-purple-800 whitespace-nowrap">Preço Venda</th>
                <th className="px-3 py-3 text-right font-semibold text-purple-800 whitespace-nowrap bg-green-50">Lucro Bruto</th>
                <th className="px-3 py-3 text-right font-semibold text-purple-800 whitespace-nowrap bg-green-50">Lucro Líquido</th>
                <th className="px-3 py-3 text-left font-semibold text-purple-800 whitespace-nowrap">Status</th>
                <th className="px-3 py-3 text-left font-semibold text-purple-800 whitespace-nowrap">Forma Pgto</th>
                <th className="px-3 py-3 text-left font-semibold text-purple-800 whitespace-nowrap">Plataforma</th>
                <th className="px-3 py-3 text-right font-semibold text-purple-800 whitespace-nowrap">Parcela 1</th>
                <th className="px-3 py-3 text-right font-semibold text-purple-800 whitespace-nowrap">Parcela 2</th>
                <th className="px-3 py-3 text-right font-semibold text-purple-800 whitespace-nowrap">Parcela 3</th>
                <th className="px-3 py-3 text-right font-semibold text-purple-800 whitespace-nowrap bg-amber-50">Faltante</th>
                <th className="px-3 py-3 text-center font-semibold text-purple-800 whitespace-nowrap">Ações</th>
              </tr>
            </thead>
            <tbody>
              {/* Nova linha */}
              {newRow && (
                <tr className="border-b border-purple-200 bg-purple-50/50">
                  <td className="px-2 py-1"><EditCell type="date" value={newRow.data_venda} onChange={v => updateNewRow('data_venda', v)} width="w-36" /></td>
                  <td className="px-2 py-1"><EditCell value={newRow.comprador} onChange={v => updateNewRow('comprador', v)} placeholder="Comprador" width="w-36" /></td>
                  <td className="px-2 py-1">
                    <select
                      value={newRow.nome_perfume || ""}
                      onChange={e => handlePerfumeSelectNew(e.target.value)}
                      className="w-40 px-2 py-1 text-sm border border-purple-300 rounded focus:outline-none bg-white"
                    >
                      <option value="">Selecione...</option>
                      {perfumeOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </td>
                  <td className="px-2 py-1"><EditCell value={newRow.marca} onChange={v => updateNewRow('marca', v)} placeholder="Marca" width="w-32" /></td>
                  <td className="px-2 py-1"><EditCell type="number" value={newRow.preco_dolar} onChange={v => updateNewRow('preco_dolar', v)} placeholder="0" width="w-20" /></td>
                  <td className="px-2 py-1"><EditCell type="number" value={newRow.cotacao_dolar} onChange={v => updateNewRow('cotacao_dolar', v)} width="w-20" /></td>
                  <td className="px-2 py-1 bg-orange-50/50"><input value={newRow.custo_reais.toFixed(2)} disabled className="w-24 px-2 py-1 text-sm bg-orange-50 text-orange-700 rounded" readOnly /></td>
                  <td className="px-2 py-1"><EditCell type="number" value={newRow.preco_venda} onChange={v => updateNewRow('preco_venda', v)} placeholder="0" width="w-24" /></td>
                  <td className="px-2 py-1 bg-green-50/50"><input value={newRow.lucro_bruto.toFixed(2)} disabled className="w-24 px-2 py-1 text-sm bg-green-50 text-green-700 rounded" readOnly /></td>
                  <td className="px-2 py-1 bg-green-50/50"><input value={newRow.lucro_liquido.toFixed(2)} disabled className="w-24 px-2 py-1 text-sm bg-green-50 text-green-700 rounded" readOnly /></td>
                  <td className="px-2 py-1">
                    <SelectCell value={newRow.status_pagamento} onChange={v => updateNewRow('status_pagamento', v)} options={["PAGO","PENDENTE","PARCIAL"]} width="w-28" />
                  </td>
                  <td className="px-2 py-1">
                    <SelectCell value={newRow.forma_pagamento} onChange={v => updateNewRow('forma_pagamento', v)} options={["PIX/À VISTA","PIX PARCELADO","CARTÃO","DINHEIRO"]} width="w-36" />
                  </td>
                  <td className="px-2 py-1">
                    <SelectCell value={newRow.plataforma} onChange={v => updateNewRow('plataforma', v)} options={PLATAFORMAS} placeholder="Plataforma" width="w-36" />
                  </td>
                  <td className="px-2 py-1"><EditCell type="number" value={newRow.parcela_1} onChange={v => updateNewRow('parcela_1', v)} placeholder="0" width="w-20" /></td>
                  <td className="px-2 py-1"><EditCell type="number" value={newRow.parcela_2} onChange={v => updateNewRow('parcela_2', v)} placeholder="0" width="w-20" /></td>
                  <td className="px-2 py-1"><EditCell type="number" value={newRow.parcela_3} onChange={v => updateNewRow('parcela_3', v)} placeholder="0" width="w-20" /></td>
                  <td className="px-2 py-1 bg-amber-50/50"><input value={newRow.valor_faltante.toFixed(2)} disabled className="w-20 px-2 py-1 text-sm bg-amber-50 text-amber-700 rounded" readOnly /></td>
                  <td className="px-2 py-1">
                    <div className="flex gap-1 justify-center">
                      <button onClick={handleSaveNew} className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200"><Check className="w-4 h-4" /></button>
                      <button onClick={() => setNewRow(null)} className="p-1.5 rounded-lg bg-red-100 text-red-600 hover:bg-red-200"><X className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              )}

              {/* Linhas existentes */}
              {filteredVendas.map((venda, index) => {
                const isEditing = editingId === venda.id;
                const row = isEditing ? editData : venda;

                return (
                  <motion.tr
                    key={venda.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.02 }}
                    className={`border-b border-gray-100 ${isEditing ? 'bg-blue-50/40' : 'hover:bg-gray-50/50'} transition-colors`}
                  >
                    <td className="px-2 py-1">
                      {isEditing
                        ? <EditCell type="date" value={row.data_venda} onChange={v => updateEditData('data_venda', v)} width="w-36" />
                        : <span className="px-2 text-gray-700 whitespace-nowrap">{venda.data_venda ? format(new Date(venda.data_venda), "dd/MM/yyyy") : "-"}</span>}
                    </td>
                    <td className="px-2 py-1">
                      {isEditing
                        ? <EditCell value={row.comprador} onChange={v => updateEditData('comprador', v)} width="w-36" />
                        : <span className="px-2 font-medium text-gray-900">{venda.comprador}</span>}
                    </td>
                    <td className="px-2 py-1">
                      {isEditing
                        ? <EditCell value={row.nome_perfume} onChange={v => updateEditData('nome_perfume', v)} width="w-40" />
                        : <span className="px-2 text-gray-700">{venda.nome_perfume}</span>}
                    </td>
                    <td className="px-2 py-1">
                      {isEditing
                        ? <EditCell value={row.marca} onChange={v => updateEditData('marca', v)} width="w-32" />
                        : <span className="px-2 text-gray-500">{venda.marca}</span>}
                    </td>
                    <td className="px-2 py-1 text-right">
                      {isEditing
                        ? <EditCell type="number" value={row.preco_dolar} onChange={v => updateEditData('preco_dolar', v)} width="w-20" />
                        : <span className="px-2 text-gray-700">${venda.preco_dolar || "-"}</span>}
                    </td>
                    <td className="px-2 py-1 text-right">
                      {isEditing
                        ? <EditCell type="number" value={row.cotacao_dolar} onChange={v => updateEditData('cotacao_dolar', v)} width="w-20" />
                        : <span className="px-2 text-gray-700">{venda.cotacao_dolar || "-"}</span>}
                    </td>
                    <td className="px-2 py-1 text-right bg-orange-50/30">
                      <span className="px-2 text-orange-700">{(isEditing ? row.custo_reais : venda.custo_reais)?.toFixed(2) || "-"}</span>
                    </td>
                    <td className="px-2 py-1 text-right">
                      {isEditing
                        ? <EditCell type="number" value={row.preco_venda} onChange={v => updateEditData('preco_venda', v)} width="w-24" />
                        : <span className="px-2 font-semibold text-gray-900">R$ {venda.preco_venda?.toFixed(2)}</span>}
                    </td>
                    <td className="px-2 py-1 text-right bg-green-50/30">
                      <span className={`px-2 font-medium ${(isEditing ? row.lucro_bruto : venda.lucro_bruto) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {(isEditing ? row.lucro_bruto : venda.lucro_bruto)?.toFixed(2) || "0.00"}
                      </span>
                    </td>
                    <td className="px-2 py-1 text-right bg-green-50/30">
                      <span className={`px-2 font-medium ${(isEditing ? row.lucro_liquido : venda.lucro_liquido) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {(isEditing ? row.lucro_liquido : venda.lucro_liquido)?.toFixed(2) || "0.00"}
                      </span>
                    </td>
                    <td className="px-2 py-1">
                      {isEditing
                        ? <SelectCell value={row.status_pagamento} onChange={v => updateEditData('status_pagamento', v)} options={["PAGO","PENDENTE","PARCIAL"]} width="w-28" />
                        : <Badge className={`${statusColors[venda.status_pagamento]} border text-xs`}>{venda.status_pagamento}</Badge>}
                    </td>
                    <td className="px-2 py-1">
                      {isEditing
                        ? <SelectCell value={row.forma_pagamento} onChange={v => updateEditData('forma_pagamento', v)} options={["PIX/À VISTA","PIX PARCELADO","CARTÃO","DINHEIRO"]} width="w-36" />
                        : <span className="px-2 text-gray-700 text-xs whitespace-nowrap">{venda.forma_pagamento}</span>}
                    </td>
                    <td className="px-2 py-1">
                      {isEditing
                        ? <SelectCell value={row.plataforma} onChange={v => updateEditData('plataforma', v)} options={PLATAFORMAS} width="w-36" />
                        : <span className="px-2 text-gray-600 text-xs">{venda.plataforma}</span>}
                    </td>
                    <td className="px-2 py-1 text-right">
                      {isEditing
                        ? <EditCell type="number" value={row.parcela_1} onChange={v => updateEditData('parcela_1', v)} width="w-20" />
                        : <span className="px-2 text-gray-700">{venda.parcela_1 > 0 ? venda.parcela_1?.toFixed(2) : "-"}</span>}
                    </td>
                    <td className="px-2 py-1 text-right">
                      {isEditing
                        ? <EditCell type="number" value={row.parcela_2} onChange={v => updateEditData('parcela_2', v)} width="w-20" />
                        : <span className="px-2 text-gray-700">{venda.parcela_2 > 0 ? venda.parcela_2?.toFixed(2) : "-"}</span>}
                    </td>
                    <td className="px-2 py-1 text-right">
                      {isEditing
                        ? <EditCell type="number" value={row.parcela_3} onChange={v => updateEditData('parcela_3', v)} width="w-20" />
                        : <span className="px-2 text-gray-700">{venda.parcela_3 > 0 ? venda.parcela_3?.toFixed(2) : "-"}</span>}
                    </td>
                    <td className="px-2 py-1 text-right bg-amber-50/30">
                      <span className={`px-2 font-medium ${(isEditing ? row.valor_faltante : venda.valor_faltante) > 0 ? 'text-amber-600' : 'text-gray-400'}`}>
                        {(isEditing ? row.valor_faltante : venda.valor_faltante) > 0 ? (isEditing ? row.valor_faltante : venda.valor_faltante)?.toFixed(2) : "-"}
                      </span>
                    </td>
                    <td className="px-2 py-1">
                      <div className="flex gap-1 justify-center">
                        {isEditing ? (
                          <>
                            <button onClick={handleSaveEdit} className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200"><Check className="w-4 h-4" /></button>
                            <button onClick={() => setEditingId(null)} className="p-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200"><X className="w-4 h-4" /></button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => handleStartEdit(venda)} className="p-1.5 rounded-lg text-gray-400 hover:text-purple-600 hover:bg-purple-50"><Pencil className="w-4 h-4" /></button>
                            <button onClick={() => handleDelete(venda.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
                          </>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                );
              })}

              {filteredVendas.length === 0 && !newRow && (
                <tr>
                  <td colSpan={18} className="text-center py-12 text-gray-400">
                    Nenhuma venda encontrada. Clique em "Nova Venda" para adicionar.
                  </td>
                </tr>
              )}
            </tbody>

            {/* Totais */}
            <tfoot>
              <tr className="bg-purple-50 border-t-2 border-purple-200 font-semibold">
                <td colSpan={7} className="px-3 py-2 text-right text-purple-700">TOTAIS:</td>
                <td className="px-3 py-2 text-right text-purple-700">R$ {totalVendas.toFixed(2)}</td>
                <td className="px-3 py-2 text-right text-emerald-600">{totalLucro.toFixed(2)}</td>
                <td className="px-3 py-2 text-right text-emerald-600">{totalLucro.toFixed(2)}</td>
                <td colSpan={6} />
                <td className="px-3 py-2 text-right text-amber-600">{totalPendente.toFixed(2)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}