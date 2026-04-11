import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Search, Pencil, Check, X } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { toast } from "sonner";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { supabase } from "@/lib/supabase";

interface EditState {
  nome: string;
  precoReferencia: string;
}

export default function EletronicosCatalogo() {
  const { state, addProdutoEletronico, deleteProdutoEletronicoAction, reload } = useApp();
  const [search, setSearch]   = useState("");
  const [open, setOpen]       = useState(false);
  const [nome, setNome]       = useState("");
  const [precoRef, setPrecoRef] = useState("");
  const [errors, setErrors]   = useState<Record<string, string>>({});

  // Edição inline
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [editForm, setEditForm]     = useState<EditState>({ nome: "", precoReferencia: "" });
  const [savingEdit, setSavingEdit] = useState(false);

  const filtered = state.catalogoEletronicos.filter((p) =>
    p.nome.toLowerCase().includes(search.toLowerCase())
  );

  function validate() {
    const e: Record<string, string> = {};
    if (!nome.trim())                                      e.nome     = "Nome é obrigatório.";
    if (!parseFloat(precoRef) || parseFloat(precoRef) <= 0) e.precoRef = "Informe o preço de referência.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleAdd() {
    if (!validate()) return;
    try {
      await addProdutoEletronico({ nome: nome.trim(), precoReferencia: parseFloat(precoRef) });
      toast.success("Produto adicionado ao catálogo!");
      setNome(""); setPrecoRef(""); setErrors({});
      setOpen(false);
    } catch { toast.error("Erro ao adicionar produto."); }
  }

  function abrirEdicao(p: typeof state.catalogoEletronicos[0]) {
    setEditandoId(p.id);
    setEditForm({
      nome:            p.nome,
      precoReferencia: p.precoReferencia > 0 ? p.precoReferencia.toFixed(2) : "",
    });
  }

  function cancelarEdicao() { setEditandoId(null); }

  async function salvarEdicao(id: string) {
    const preco = parseFloat(editForm.precoReferencia.replace(",", ".")) || 0;
    if (!editForm.nome.trim())   { toast.error("Nome é obrigatório."); return; }
    if (preco <= 0)              { toast.error("Informe o preço de referência."); return; }
    setSavingEdit(true);
    try {
      const { error } = await supabase.from("catalogo_eletronicos")
        .update({ nome: editForm.nome.trim(), preco_referencia: preco })
        .eq("id", id);
      if (error) throw error;
      toast.success("Produto atualizado!");
      setEditandoId(null);
      await reload();
    } catch { toast.error("Erro ao salvar alterações."); }
    finally { setSavingEdit(false); }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Catálogo — Eletrônicos</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {state.catalogoEletronicos.length} produtos cadastrados
          </p>
        </div>

        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setNome(""); setPrecoRef(""); setErrors({}); } }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Novo Produto</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Produto</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nome *</Label>
                <Input placeholder="Ex: iPhone 15 Pro" value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className={errors.nome ? "border-destructive" : ""} />
                {errors.nome && <p className="text-xs text-destructive mt-1">{errors.nome}</p>}
              </div>
              <div>
                <Label>Preço de Referência (BRL) *</Label>
                <Input type="number" placeholder="0.00" value={precoRef}
                  onChange={(e) => setPrecoRef(e.target.value)}
                  className={errors.precoRef ? "border-destructive" : ""} />
                {errors.precoRef && <p className="text-xs text-destructive mt-1">{errors.precoRef}</p>}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={handleAdd}>Adicionar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Busca */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar produto..." className="pl-9"
          value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {/* Tabela */}
      <div className="glass-card rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Preço de Referência</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground py-12">
                  {search ? "Nenhum produto encontrado." : "Nenhum produto no catálogo ainda."}
                </TableCell>
              </TableRow>
            ) : filtered.map((p) => {
              const editando = editandoId === p.id;
              return (
                <TableRow key={p.id} className={editando ? "bg-muted/30" : ""}>
                  {/* Nome */}
                  <TableCell>
                    {editando
                      ? <Input className="h-8 text-sm w-56" value={editForm.nome}
                          onChange={(e) => setEditForm((f) => ({ ...f, nome: e.target.value }))} />
                      : <span className="font-medium">{p.nome}</span>}
                  </TableCell>

                  {/* Preço Referência */}
                  <TableCell>
                    {editando
                      ? <Input className="h-8 text-sm w-32" type="number" placeholder="0.00"
                          value={editForm.precoReferencia}
                          onChange={(e) => setEditForm((f) => ({ ...f, precoReferencia: e.target.value }))} />
                      : <span className="font-semibold">
                          {p.precoReferencia > 0
                            ? p.precoReferencia.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
                            : "—"}
                        </span>}
                  </TableCell>

                  {/* Ações */}
                  <TableCell>
                    {editando ? (
                      <div className="flex items-center gap-1">
                        <Button size="sm" variant="ghost"
                          className="h-8 w-8 p-0 text-success hover:text-success"
                          disabled={savingEdit} onClick={() => salvarEdicao(p.id)}>
                          <Check className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost"
                          className="h-8 w-8 p-0 text-muted-foreground"
                          disabled={savingEdit} onClick={cancelarEdicao}>
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <Button size="sm" variant="ghost"
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                          onClick={() => abrirEdicao(p)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <ConfirmDelete
                          descricao={p.nome}
                          onConfirm={async () => {
                            await deleteProdutoEletronicoAction(p.id);
                            toast.success(`"${p.nome}" removido do catálogo.`);
                          }}
                        />
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}