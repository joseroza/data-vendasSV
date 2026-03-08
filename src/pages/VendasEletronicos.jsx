import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";

export default function VendasEletronicos() {
  const [showForm, setShowForm] = useState(false);
  const [editingVenda, setEditingVenda] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  const queryClient = useQueryClient();

  const { data: vendas = [] } = useQuery({
    queryKey: ['vendas-eletronicos'],
    queryFn: () => base44.entities.VendaEletronico.list('-data_venda')
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.VendaEletronico.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendas-eletronicos'] });
      setShowForm(false);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.VendaEletronico.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendas-eletronicos'] });
      setShowForm(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.VendaEletronico.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vendas-eletronicos'] })
  });

  const [formData, setFormData] = useState({
    data_venda: new Date().toISOString().split('T')[0],
    comprador: "",
    produto: "",
    marca: "",
    preco_venda: 0,
    status_pagamento: "PENDENTE",
    forma_pagamento: "PIX PARCELADO",
    parcelas: [],
    valor_pago: 0,
    valor_faltante: 0
  });

  const handleEdit = (venda) => {
    setEditingVenda(venda);
    setFormData(venda);
    setShowForm(true);
  };

  const handleSave = () => {
    const totalPago = formData.parcelas?.reduce((acc, p) => p.pago ? acc + (p.valor || 0) : acc, 0) || 0;
    const data = {
      ...formData,
      valor_pago: totalPago,
      valor_faltante: formData.preco_venda - totalPago
    };
    
    if (editingVenda) {
      updateMutation.mutate({ id: editingVenda.id, data });
    } else {
      createMutation.mutate(data);
    }
    setEditingVenda(null);
  };

  const handleDelete = (id) => {
    if (confirm("Tem certeza que deseja excluir esta venda?")) {
      deleteMutation.mutate(id);
    }
  };

  const addParcela = () => {
    setFormData(prev => ({
      ...prev,
      parcelas: [...(prev.parcelas || []), { valor: 0, data_vencimento: "", pago: false }]
    }));
  };

  const updateParcela = (index, field, value) => {
    const newParcelas = [...(formData.parcelas || [])];
    newParcelas[index] = { ...newParcelas[index], [field]: value };
    setFormData({ ...formData, parcelas: newParcelas });
  };

  const removeParcela = (index) => {
    setFormData(prev => ({
      ...prev,
      parcelas: prev.parcelas.filter((_, i) => i !== index)
    }));
  };

  const filteredVendas = vendas.filter(v => 
    v.comprador?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.produto?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const statusColors = {
    PAGO: "bg-emerald-100 text-emerald-700",
    PENDENTE: "bg-amber-100 text-amber-700",
    PARCIAL: "bg-blue-100 text-blue-700"
  };

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
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              Vendas de Eletrônicos
            </h1>
            <p className="text-gray-500 mt-1">{filteredVendas.length} vendas registradas</p>
          </div>
          <Button 
            onClick={() => { 
              setEditingVenda(null); 
              setFormData({
                data_venda: new Date().toISOString().split('T')[0],
                comprador: "",
                produto: "",
                marca: "",
                preco_venda: 0,
                status_pagamento: "PENDENTE",
                forma_pagamento: "PIX PARCELADO",
                parcelas: [],
                valor_pago: 0,
                valor_faltante: 0
              });
              setShowForm(true); 
            }}
            className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-lg"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Venda
          </Button>
        </motion.div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Buscar por comprador ou produto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white/80"
          />
        </div>

        {/* Table */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100 shadow-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/80">
                <TableHead>Data</TableHead>
                <TableHead>Comprador</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead>Marca</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Pago</TableHead>
                <TableHead className="text-right">Faltante</TableHead>
                <TableHead className="text-center">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVendas.map((venda) => (
                <TableRow key={venda.id} className="hover:bg-blue-50/30">
                  <TableCell>
                    {venda.data_venda ? format(new Date(venda.data_venda), "dd/MM/yyyy") : "-"}
                  </TableCell>
                  <TableCell className="font-medium">{venda.comprador}</TableCell>
                  <TableCell>{venda.produto}</TableCell>
                  <TableCell>{venda.marca}</TableCell>
                  <TableCell className="text-right font-semibold">
                    R$ {venda.preco_venda?.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColors[venda.status_pagamento]}>
                      {venda.status_pagamento}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-emerald-600 font-medium">
                    R$ {venda.valor_pago?.toFixed(2) || "0.00"}
                  </TableCell>
                  <TableCell className="text-right text-amber-600 font-medium">
                    R$ {venda.valor_faltante?.toFixed(2) || "0.00"}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-center gap-1">
                      <Button size="icon" variant="ghost" onClick={() => handleEdit(venda)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => handleDelete(venda.id)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Form Modal */}
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingVenda ? "Editar Venda" : "Nova Venda de Eletrônico"}</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Data da Venda</Label>
                  <Input
                    type="date"
                    value={formData.data_venda}
                    onChange={(e) => setFormData({ ...formData, data_venda: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Comprador</Label>
                  <Input
                    value={formData.comprador}
                    onChange={(e) => setFormData({ ...formData, comprador: e.target.value })}
                    placeholder="Nome do comprador"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Produto</Label>
                  <Input
                    value={formData.produto}
                    onChange={(e) => setFormData({ ...formData, produto: e.target.value })}
                    placeholder="Nome do produto"
                  />
                </div>
                <div>
                  <Label>Marca</Label>
                  <Input
                    value={formData.marca}
                    onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
                    placeholder="Marca"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Preço de Venda (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.preco_venda}
                    onChange={(e) => setFormData({ ...formData, preco_venda: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={formData.status_pagamento} onValueChange={(v) => setFormData({ ...formData, status_pagamento: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PAGO">PAGO</SelectItem>
                      <SelectItem value="PENDENTE">PENDENTE</SelectItem>
                      <SelectItem value="PARCIAL">PARCIAL</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Forma de Pagamento</Label>
                  <Select value={formData.forma_pagamento} onValueChange={(v) => setFormData({ ...formData, forma_pagamento: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PIX/À VISTA">PIX/À VISTA</SelectItem>
                      <SelectItem value="PIX PARCELADO">PIX PARCELADO</SelectItem>
                      <SelectItem value="CARTÃO">CARTÃO</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Parcelas */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Parcelas</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addParcela}>
                    <Plus className="w-4 h-4 mr-1" /> Adicionar
                  </Button>
                </div>
                <div className="space-y-2">
                  {formData.parcelas?.map((parcela, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                      <Input
                        type="number"
                        placeholder="Valor"
                        value={parcela.valor}
                        onChange={(e) => updateParcela(index, 'valor', parseFloat(e.target.value) || 0)}
                        className="w-24"
                      />
                      <Input
                        type="date"
                        value={parcela.data_vencimento}
                        onChange={(e) => updateParcela(index, 'data_vencimento', e.target.value)}
                      />
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={parcela.pago}
                          onChange={(e) => updateParcela(index, 'pago', e.target.checked)}
                          className="rounded"
                        />
                        Pago
                      </label>
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeParcela(index)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
                <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
                  {editingVenda ? "Salvar" : "Registrar"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}