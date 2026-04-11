import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Search, Package, Calculator, Pencil, Check, X } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { toast } from "sonner";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { supabase } from "@/lib/supabase";

interface FormState {
  marca: string; nome: string; quantidade: string;
  precoUsd: string; cotacao: string;
}
interface EditState {
  marca: string; nome: string; quantidade: string;
  precoUsd: string; cotacao: string;
}
const emptyForm: FormState = { marca: "", nome: "", quantidade: "", precoUsd: "", cotacao: "" };

function fmtBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function EstoqueForm({ form, errors, onChange, margem, custoBRL, precoVenda }: {
  form: FormState;
  errors: Partial<Record<keyof FormState, string>>;
  onChange: (k: keyof FormState, v: string) => void;
  margem: number; custoBRL: number; precoVenda: number;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Marca *</Label>
          <Input placeholder="Ex: Dior, Lattafa" value={form.marca}
            onChange={(e) => onChange("marca", e.target.value)}
            className={errors.marca ? "border-destructive" : ""} />
          {errors.marca && <p className="text-xs text-destructive mt-1">{errors.marca}</p>}
        </div>
        <div>
          <Label>Nome do Perfume *</Label>
          <Input placeholder="Ex: Sauvage, 1910..." value={form.nome}
            onChange={(e) => onChange("nome", e.target.value)}
            className={errors.nome ? "border-destructive" : ""} />
          {errors.nome && <p className="text-xs text-destructive mt-1">{errors.nome}</p>}
        </div>
      </div>
      <div>
        <Label>Quantidade em Estoque *</Label>
        <Input type="number" min={0} placeholder="0" value={form.quantidade}
          onChange={(e) => onChange("quantidade", e.target.value)}
          className={errors.quantidade ? "border-destructive" : ""} />
        {errors.quantidade && <p className="text-xs text-destructive mt-1">{errors.quantidade}</p>}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Preço de Custo (USD) *</Label>
          <Input type="number" placeholder="0.00" inputMode="decimal" value={form.precoUsd}
            onChange={(e) => onChange("precoUsd", e.target.value)}
            className={errors.precoUsd ? "border-destructive" : ""} />
          {errors.precoUsd && <p className="text-xs text-destructive mt-1">{errors.precoUsd}</p>}
        </div>
        <div>
          <Label>Cotação USD → R$ *</Label>
          <Input type="number" placeholder="Ex: 5.80" inputMode="decimal" value={form.cotacao}
            onChange={(e) => onChange("cotacao", e.target.value)}
            className={errors.cotacao ? "border-destructive" : ""} />
          {errors.cotacao && <p className="text-xs text-destructive mt-1">{errors.cotacao}</p>}
        </div>
      </div>
      {custoBRL > 0 && (
        <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
            <Calculator className="h-3.5 w-3.5" /> Calculado automaticamente
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Custo em BRL</p>
              <p className="text-lg font-bold">{fmtBRL(custoBRL)}</p>
              <p className="text-xs text-muted-foreground">USD × cotação</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Preço de Venda (+{margem}%)</p>
              <p className="text-lg font-bold text-primary">{fmtBRL(precoVenda)}</p>
              <p className="text-xs text-muted-foreground">Custo BRL + {margem}% margem</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PerfumesCatalogo() {
  const { state, deleteProdutoPerfumeAction, reload } = useApp();
  const [search, setSearch]   = useState("");
  const [open, setOpen]       = useState(false);
  const [form, setForm]       = useState<FormState>(emptyForm);
  const [errors, setErrors]   = useState<Partial<Record<keyof FormState, string>>>({});
  const [loading, setLoading] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [editForm, setEditForm]     = useState<EditState>({ marca: "", nome: "", quantidade: "", precoUsd: "", cotacao: "" });
  const [savingEdit, setSavingEdit] = useState(false);

  const margem = state.margem ?? 20;

  // Cálculos do formulário de adição
  const usd     = parseFloat(form.precoUsd.replace(",", ".")) || 0;
  const cotacao = parseFloat(form.cotacao.replace(",", "."))  || 0;
  const custoBRL   = usd * cotacao;
  const precoVenda = custoBRL * (1 + margem / 100);

  // Cálculos da edição inline — reativos conforme o usuário digita
  const editUsd     = parseFloat(editForm.precoUsd.replace(",", ".")) || 0;
  const editCotacao = parseFloat(editForm.cotacao.replace(",", "."))  || 0;
  const editCustoBRL   = editUsd * editCotacao;
  const editPrecoVenda = editCustoBRL * (1 + margem / 100);

  const filtered = state.catalogoPerfumes.filter((p) => {
    const q = search.toLowerCase();
    return p.nome.toLowerCase().includes(q) || (p.marca ?? "").toLowerCase().includes(q);
  });
  const totalItens = state.catalogoPerfumes.reduce((s, p) => s + (p.quantidade ?? 0), 0);

  function onChange(k: keyof FormState, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }));
  }

  function validate(): boolean {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!form.marca.trim())       e.marca      = "Marca é obrigatória.";
    if (!form.nome.trim())        e.nome       = "Nome é obrigatório.";
    const qtd = parseInt(form.quantidade);
    if (isNaN(qtd) || qtd < 0)   e.quantidade = "Informe a quantidade.";
    if (!usd     || usd     <= 0) e.precoUsd   = "Informe o preço USD.";
    if (!cotacao || cotacao <= 0) e.cotacao    = "Informe a cotação.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleAdd() {
    if (!validate()) return;
    setLoading(true);
    try {
      const { error } = await supabase.from("catalogo_perfumes").insert({
        marca: form.marca.trim(), nome: form.nome.trim(),
        quantidade: parseInt(form.quantidade),
        preco_usd: usd, cotacao, preco_brl: precoVenda,
      });
      if (error) throw error;
      toast.success("Perfume adicionado ao estoque!");
      setForm(emptyForm); setErrors({}); setOpen(false);
      await reload();
    } catch { toast.error("Erro ao adicionar perfume."); }
    finally { setLoading(false); }
  }

  function abrirEdicao(p: typeof state.catalogoPerfumes[0]) {
    setEditandoId(p.id);
    const cotacaoSalva = (p as any).cotacao ?? 0;
    setEditForm({
      marca:      p.marca ?? "",
      nome:       p.nome,
      quantidade: String(p.quantidade ?? 0),
      precoUsd:   p.precoUsd > 0 ? String(p.precoUsd) : "",
      cotacao:    cotacaoSalva > 0 ? String(cotacaoSalva) : "",
    });
  }

  function cancelarEdicao() { setEditandoId(null); }

  async function salvarEdicao(id: string) {
    const qtd = parseInt(editForm.quantidade);
    if (!editForm.marca.trim() || !editForm.nome.trim()) { toast.error("Marca e nome são obrigatórios."); return; }
    if (isNaN(qtd) || qtd < 0) { toast.error("Quantidade inválida."); return; }
    if (editUsd <= 0)          { toast.error("Informe o preço USD."); return; }
    if (editCotacao <= 0)      { toast.error("Informe a cotação."); return; }
    setSavingEdit(true);
    try {
      const { error } = await supabase.from("catalogo_perfumes").update({
        marca:      editForm.marca.trim(),
        nome:       editForm.nome.trim(),
        quantidade: qtd,
        preco_usd:  editUsd,
        cotacao:    editCotacao,
        preco_brl:  editPrecoVenda,   // recalcula com a margem atual automaticamente
      }).eq("id", id);
      if (error) throw error;
      toast.success("Perfume atualizado!");
      setEditandoId(null);
      await reload();
    } catch { toast.error("Erro ao salvar alterações."); }
    finally { setSavingEdit(false); }
  }

  function estoqueLabel(qtd: number) {
    if (qtd === 0) return <Badge variant="destructive">Sem estoque</Badge>;
    if (qtd <= 2)  return <Badge variant="outline" className="text-warning border-warning">{qtd} un — Baixo</Badge>;
    return <Badge variant="secondary">{qtd} un</Badge>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title flex items-center gap-2"><Package className="h-6 w-6" /> Estoque — Perfumes</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {state.catalogoPerfumes.length} perfumes · {totalItens} unidades em estoque
          </p>
        </div>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setForm(emptyForm); setErrors({}); } }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Novo Perfume</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Adicionar ao Estoque</DialogTitle></DialogHeader>
            <EstoqueForm form={form} errors={errors} onChange={onChange}
              margem={margem} custoBRL={custoBRL} precoVenda={precoVenda} />
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={handleAdd} disabled={loading}>{loading ? "Salvando..." : "Adicionar"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar por marca ou nome..." className="pl-9"
          value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="glass-card rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Marca</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Estoque</TableHead>
              <TableHead>USD</TableHead>
              <TableHead>Cotação R$</TableHead>
              <TableHead>Custo BRL</TableHead>
              <TableHead>Preço Venda</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-12">
                  {search ? "Nenhum perfume encontrado." : "Nenhum perfume no estoque ainda."}
                </TableCell>
              </TableRow>
            ) : filtered.map((p) => {
              const editando  = editandoId === p.id;
              const cotacaoP  = (p as any).cotacao ?? 0;
              const custoBRLP = p.precoUsd > 0 && cotacaoP > 0 ? p.precoUsd * cotacaoP : 0;

              return (
                <TableRow key={p.id} className={editando ? "bg-muted/30" : ""}>

                  {/* Marca */}
                  <TableCell>
                    {editando
                      ? <Input className="h-8 text-sm w-28" value={editForm.marca}
                          onChange={(e) => setEditForm((f) => ({ ...f, marca: e.target.value }))} />
                      : <span className="font-semibold text-primary">{p.marca ?? "—"}</span>}
                  </TableCell>

                  {/* Nome */}
                  <TableCell>
                    {editando
                      ? <Input className="h-8 text-sm w-36" value={editForm.nome}
                          onChange={(e) => setEditForm((f) => ({ ...f, nome: e.target.value }))} />
                      : <span className="font-medium">{p.nome}</span>}
                  </TableCell>

                  {/* Estoque */}
                  <TableCell>
                    {editando
                      ? <Input className="h-8 text-sm w-16" type="number" min={0}
                          value={editForm.quantidade}
                          onChange={(e) => setEditForm((f) => ({ ...f, quantidade: e.target.value }))} />
                      : estoqueLabel(p.quantidade ?? 0)}
                  </TableCell>

                  {/* USD */}
                  <TableCell>
                    {editando
                      ? <Input className="h-8 text-sm w-20" type="number" placeholder="0.00"
                          value={editForm.precoUsd}
                          onChange={(e) => setEditForm((f) => ({ ...f, precoUsd: e.target.value }))} />
                      : <span className="text-sm text-muted-foreground">
                          {p.precoUsd > 0 ? `$ ${p.precoUsd.toFixed(2)}` : "—"}
                        </span>}
                  </TableCell>

                  {/* Cotação */}
                  <TableCell>
                    {editando
                      ? <Input className="h-8 text-sm w-20" type="number" placeholder="5.80"
                          value={editForm.cotacao}
                          onChange={(e) => setEditForm((f) => ({ ...f, cotacao: e.target.value }))} />
                      : <span className="text-sm text-muted-foreground">
                          {cotacaoP > 0 ? `R$ ${cotacaoP.toFixed(2)}` : "—"}
                        </span>}
                  </TableCell>

                  {/* Custo BRL — calculado automaticamente durante edição */}
                  <TableCell>
                    {editando
                      ? <span className={`text-sm font-medium ${editCustoBRL > 0 ? "text-foreground" : "text-muted-foreground"}`}>
                          {editCustoBRL > 0 ? fmtBRL(editCustoBRL) : "—"}
                        </span>
                      : <span className="text-sm text-muted-foreground">
                          {custoBRLP > 0 ? fmtBRL(custoBRLP) : "—"}
                        </span>}
                  </TableCell>

                  {/* Preço Venda — calculado automaticamente durante edição */}
                  <TableCell>
                    {editando
                      ? <span className={`text-sm font-bold ${editPrecoVenda > 0 ? "text-primary" : "text-muted-foreground"}`}>
                          {editPrecoVenda > 0 ? fmtBRL(editPrecoVenda) : "—"}
                        </span>
                      : <span className="font-semibold">
                          {p.precoBrl > 0 ? fmtBRL(p.precoBrl) : "—"}
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
                          descricao={`${p.marca ?? ""} ${p.nome}`}
                          onConfirm={async () => {
                            await deleteProdutoPerfumeAction(p.id);
                            toast.success(`"${p.nome}" removido do estoque.`);
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