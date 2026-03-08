import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Plus, Search, Phone, Mail } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

const mockClientes = [
  { id: 1, nome: "Maria Silva", telefone: "(11) 99999-1111", email: "maria@email.com", notas: "", totalCompras: 3, totalGasto: "R$ 2.850,00" },
  { id: 2, nome: "João Santos", telefone: "(21) 98888-2222", email: "", notas: "Cliente VIP", totalCompras: 5, totalGasto: "R$ 12.400,00" },
  { id: 3, nome: "Ana Costa", telefone: "(31) 97777-3333", email: "ana@email.com", notas: "", totalCompras: 2, totalGasto: "R$ 1.800,00" },
  { id: 4, nome: "Carlos Lima", telefone: "(41) 96666-4444", email: "", notas: "Preferência por eletrônicos", totalCompras: 4, totalGasto: "R$ 8.200,00" },
  { id: 5, nome: "Pedro Alves", telefone: "(51) 95555-5555", email: "pedro@email.com", notas: "", totalCompras: 1, totalGasto: "R$ 890,00" },
];

export default function Clientes() {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = mockClientes.filter(c =>
    c.nome.toLowerCase().includes(search.toLowerCase()) ||
    c.telefone.includes(search)
  );

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Clientes</h1>
          <p className="text-muted-foreground text-sm mt-1">{mockClientes.length} clientes cadastrados</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Novo Cliente</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-display">Novo Cliente</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div><Label>Nome *</Label><Input placeholder="Nome completo" /></div>
              <div><Label>Telefone *</Label><Input placeholder="(00) 00000-0000" /></div>
              <div><Label>Email</Label><Input placeholder="email@exemplo.com" type="email" /></div>
              <div><Label>Observações</Label><Textarea placeholder="Notas sobre o cliente..." /></div>
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
        <Input placeholder="Buscar por nome ou telefone..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
      </div>

      <div className="glass-card rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Contato</TableHead>
              <TableHead>Compras</TableHead>
              <TableHead>Total Gasto</TableHead>
              <TableHead>Notas</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(c => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.nome}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-3 w-3" />{c.telefone}
                    {c.email && <><Mail className="h-3 w-3 ml-2" />{c.email}</>}
                  </div>
                </TableCell>
                <TableCell><Badge variant="secondary">{c.totalCompras}</Badge></TableCell>
                <TableCell className="font-medium">{c.totalGasto}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{c.notas || "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
