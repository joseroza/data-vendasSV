import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Search } from "lucide-react";
import { useState } from "react";

const mockProdutos = [
  { id: 1, nome: "iPhone 15 Pro", precoBrl: "R$ 5.800,00" },
  { id: 2, nome: "Samsung S24 Ultra", precoBrl: "R$ 3.500,00" },
  { id: 3, nome: "AirPods Pro", precoBrl: "R$ 1.200,00" },
  { id: 4, nome: "MacBook Air M3", precoBrl: "R$ 8.500,00" },
  { id: 5, nome: "iPad Pro 12.9", precoBrl: "R$ 7.200,00" },
];

export default function EletronicosCatalogo() {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const filtered = mockProdutos.filter(p => p.nome.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Catálogo — Eletrônicos</h1>
          <p className="text-muted-foreground text-sm mt-1">{mockProdutos.length} produtos cadastrados</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Novo Produto</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-display">Novo Produto</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Nome *</Label><Input placeholder="Ex: iPhone 15 Pro" /></div>
              <div><Label>Preço BRL (custo base)</Label><Input type="number" placeholder="0.00" /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={() => setOpen(false)}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar produto..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
      </div>

      <div className="glass-card rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Preço Base (BRL)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(p => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.nome}</TableCell>
                <TableCell>{p.precoBrl}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
