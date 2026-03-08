import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Package, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import EstoqueTable from "@/components/estoque/EstoqueTable";
import EstoqueForm from "@/components/estoque/EstoqueForm";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Estoque() {
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [generoFilter, setGeneroFilter] = useState("all");
  const [estoqueFilter, setEstoqueFilter] = useState("all");
  
  const queryClient = useQueryClient();

  const { data: estoque = [] } = useQuery({
    queryKey: ['estoque'],
    queryFn: () => base44.entities.EstoquePerfume.list('perfume')
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.EstoquePerfume.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estoque'] });
      setShowForm(false);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.EstoquePerfume.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estoque'] });
      setShowForm(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.EstoquePerfume.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['estoque'] })
  });

  const handleSave = (data) => {
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data });
    } else {
      createMutation.mutate(data);
    }
    setEditingItem(null);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    if (confirm("Tem certeza que deseja excluir este item?")) {
      deleteMutation.mutate(id);
    }
  };

  const filteredEstoque = estoque.filter(item => {
    const matchSearch = 
      item.perfume?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.marca?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchGenero = generoFilter === "all" || item.genero === generoFilter;
    const matchEstoque = 
      estoqueFilter === "all" || 
      (estoqueFilter === "disponivel" && item.quantidade > 0) ||
      (estoqueFilter === "esgotado" && item.quantidade === 0);
    return matchSearch && matchGenero && matchEstoque;
  });

  // Stats
  const totalItens = estoque.reduce((acc, e) => acc + (e.quantidade || 0), 0);
  const itensDisponiveis = estoque.filter(e => e.quantidade > 0).length;
  const itensEsgotados = estoque.filter(e => e.quantidade === 0).length;
  const valorEstoque = estoque.reduce((acc, e) => acc + ((e.quantidade || 0) * (e.preco_venda || 0)), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-pink-50/30 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Estoque de Perfumes
            </h1>
            <p className="text-gray-500 mt-1">{estoque.length} produtos cadastrados</p>
          </div>
          <Button 
            onClick={() => { setEditingItem(null); setShowForm(true); }}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Perfume
          </Button>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-gray-100 flex items-center gap-3">
            <div className="p-3 rounded-lg bg-indigo-100">
              <Package className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total em Estoque</p>
              <p className="text-xl font-bold text-gray-900">{totalItens} unidades</p>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-gray-100">
            <p className="text-sm text-gray-500">Produtos Disponíveis</p>
            <p className="text-xl font-bold text-emerald-600">{itensDisponiveis}</p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-gray-100 flex items-center gap-3">
            <div className="p-3 rounded-lg bg-red-100">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Esgotados</p>
              <p className="text-xl font-bold text-red-600">{itensEsgotados}</p>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-gray-100">
            <p className="text-sm text-gray-500">Valor em Estoque</p>
            <p className="text-xl font-bold text-purple-600">R$ {valorEstoque.toFixed(2)}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar por perfume ou marca..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white/80"
            />
          </div>
          <Select value={generoFilter} onValueChange={setGeneroFilter}>
            <SelectTrigger className="w-full md:w-40 bg-white/80">
              <SelectValue placeholder="Gênero" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="M">Masculino</SelectItem>
              <SelectItem value="F">Feminino</SelectItem>
              <SelectItem value="U">Unissex</SelectItem>
            </SelectContent>
          </Select>
          <Select value={estoqueFilter} onValueChange={setEstoqueFilter}>
            <SelectTrigger className="w-full md:w-40 bg-white/80">
              <SelectValue placeholder="Disponibilidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="disponivel">Disponíveis</SelectItem>
              <SelectItem value="esgotado">Esgotados</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <EstoqueTable 
          estoque={filteredEstoque}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />

        {/* Form Modal */}
        <EstoqueForm
          open={showForm}
          onClose={() => { setShowForm(false); setEditingItem(null); }}
          onSave={handleSave}
          item={editingItem}
        />
      </div>
    </div>
  );
}