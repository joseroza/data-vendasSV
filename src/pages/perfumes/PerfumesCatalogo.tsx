import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Search, Trash2 } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { toast } from "sonner";

export default function PerfumesCatalogo() {
  const { state, dispatch } = useApp();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [nome, setNome] = useState("");
  const [precoUsd, setPrecoUsd] = useState("");
  const [precoBrl, setPrecoBrl] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const filtered = state.catalogoPerfumes.filter((p) =>
    p.nome.toLowerCase().includes(search.toLowerCase())
  );

  function validate() {
    const e: Record<string, string> = {};
    if (!nome.trim()) e.nome = "Nome é obrigatório.";
    if (!parseFloat(precoUsd) || parseFloat(precoUsd) <= 0) e.precoUsd = "Informe o preço USD.";
    if (!parseFloat(precoBrl) || parseFloat(precoBrl) <= 0) e.precoBrl = "Informe o preço BRL.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleAdd() {
    if (!validate()) return;
    dispatch({
      type: "ADD_PRODUTO_PERFUME",
      payload: {
        nome: nome.trim(),
        precoUsd: parseFloat(precoUsd),
        precoBrl: parseFloat(precoBrl),
      },
    });
    toast.success("Perfume adicionado ao catálogo!");
    setNome(""); setPrecoUsd(""); setPrecoBrl(""); setErrors({});
    setOpen(false);
  }

  function handleDelete(id: string, nomeProd: string) {
    dispatch({ type: "DELETE_PRODUTO_PERFUME", payload: id });
    toast.success(`"${nomeProd}" removido do catálogo.`);
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Catálogo — Perfumes</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {state.catalogoPerfumes.length} perfumes cadastrados
          </p>
        </div>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setNome(""); setPrecoUsd(""); setPrecoBrl(""); setErrors({}); } }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Novo Perfume</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-display">Novo Perfume</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nome *</Label>
                <Input
                  placeholder="Ex: Sauvage Dior"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className={errors.nome ? "border-destructive" : ""}
                />
                {errors.nome && <p className="text-xs text-destructive mt-1">{errors.nome}</p>}
              </div>
              <div>
                <Label>Preço USD *</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={precoUsd}
                  onChange={(e) => setPrecoUsd(e.target.value)}
                  className={errors.precoUsd ? "border-destructive" : ""}
                />
                {errors.precoUsd && <p className="text-xs text-destructive mt-1">{errors.precoUsd}</p>}
              </div>
              <div>
                <Label>Preço BRL *</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={precoBrl}
                  onChange={(e) => setPrecoBrl(e.target.value)}
                  className={errors.precoBrl ? "border-destructive" : ""}
                />
                {errors.precoBrl && <p className="text-xs text-destructive mt-1">{errors.precoBrl}</p>}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={handleAdd}>Adicionar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar perfume..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="glass-card rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Preço USD</TableHead>
              <TableHead>Preço BRL</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.nome}</TableCell>
                <TableCell>${p.precoUsd.toFixed(2)}</TableCell>
                <TableCell>R$ {p.precoBrl.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDelete(p.id, p.nome)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                  Nenhum perfume encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
