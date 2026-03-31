import { useState, useMemo } from "react";
import { useApp } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, ShoppingCart, Droplets, Smartphone, Trash2, Search, Package } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import type { Compra } from "@/context/AppContext";

function fmtBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const hoje = new Date().toISOString().split("T")[0];

interface FormState {
  tipo:          "perfume" | "eletronico";
  produto_nome:  string;
  marca:         string;
  quantidade:    string;
  preco_usd:     string;
  cotacao:       string;
  preco_brl:     string;
  fornecedor:    string;
  origem:        string;
  data:          string;
  observacoes:   string;
}

const FORM_VAZIO: FormState = {
  tipo: "perfume", produto_nome: "", marca: "", quantidade: "1",
  preco_usd: "", cotacao: "", preco_brl: "", fornecedor: "", origem: "",
  data: hoje, observacoes: "",
};

export default function Compras() {
  const { state, addCompraAction, deleteCompraAction } = useApp();
  const [open, setOpen]       = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm]       = useState<FormState>(FORM_VAZIO);
  const [errors, setErrors]   = useState<Partial<FormState>>({});
  const [search, setSearch]   = useState("");
  const [filtroTipo, setFiltroTipo] = useState<"todos" | "perfume" | "eletronico">("todos");

  // Cálculo automático BRL para perfumes
  const usd  = parseFloat(form.preco_usd.replace(",", ".")) || 0;
  const cot  = parseFloat(form.cotacao.replace(",", ".")) || 0;
  const qtd  = parseFloat(form.quantidade.replace(",", ".")) || 1;
  const brlCalculado = form.tipo === "perfume" && usd > 0 && cot > 0
    ? usd * cot * qtd : 0;
  const unitCalculado = form.tipo === "perfume" && brlCalculado > 0
    ? brlCalculado / qtd
    : (parseFloat(form.preco_brl.replace(",", ".")) || 0) / Math.max(qtd, 1);

  function setF(k: keyof FormState, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }));
  }

  function validate(): boolean {
    const e: Partial<FormState> = {};
    if (!form.produto_nome.trim()) e.produto_nome = "Nome obrigatório.";
    if (!qtd || qtd <= 0) e.quantidade = "Quantidade inválida.";
    if (form.tipo === "perfume") {
      if (!usd || usd <= 0) e.preco_usd = "Preço USD obrigatório.";
      if (!cot || cot <= 0) e.cotacao = "Cotação obrigatória.";
    } else {
      const brl = parseFloat(form.preco_brl.replace(",", ".")) || 0;
      if (!brl || brl <= 0) e.preco_brl = "Custo total obrigatório.";
    }
    if (!form.data) e.data = "Data obrigatória.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSalvar() {
    if (!validate()) return;
    setLoading(true);
    try {
      const brlTotal = form.tipo === "perfume"
        ? brlCalculado
        : parseFloat(form.preco_brl.replace(",", ".")) || 0;
      const precUnit = brlTotal / Math.max(qtd, 1);

      // Converte data de YYYY-MM-DD para DD/MM/YYYY
      const [y, m, d] = form.data.split("-");
      const dataBR = `${d}/${m}/${y}`;

      await addCompraAction({
        tipo:         form.tipo,
        produto_nome: form.produto_nome.trim(),
        marca:        form.marca.trim(),
        quantidade:   qtd,
        preco_usd:    usd,
        cotacao:      cot,
        preco_brl:    brlTotal,
        preco_unit:   precUnit,
        fornecedor:   form.fornecedor.trim(),
        origem:       form.origem.trim(),
        data:         dataBR,
        observacoes:  form.observacoes.trim(),
      });
      toast.success("Compra registrada e estoque atualizado!");
      setForm(FORM_VAZIO);
      setOpen(false);
    } catch (e) {
      toast.error("Erro ao registrar compra.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  // Filtragem
  const compras = useMemo(() => {
    return (state.compras ?? []).filter((c) => {
      const q = search.toLowerCase();
      const matchSearch = !search
        || c.produto_nome.toLowerCase().includes(q)
        || c.marca.toLowerCase().includes(q)
        || c.fornecedor.toLowerCase().includes(q);
      const matchTipo = filtroTipo === "todos" || c.tipo === filtroTipo;
      return matchSearch && matchTipo;
    });
  }, [state.compras, search, filtroTipo]);

  // KPIs
  const totalInvestido  = (state.compras ?? []).reduce((s, c) => s + c.preco_brl, 0);
  const totalPerfumes   = (state.compras ?? []).filter((c) => c.tipo === "perfume").reduce((s, c) => s + c.preco_brl, 0);
  const totalEletronicos = (state.compras ?? []).filter((c) => c.tipo === "eletronico").reduce((s, c) => s + c.preco_brl, 0);
  const totalItens      = (state.compras ?? []).reduce((s, c) => s + c.quantidade, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" /> Compras
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Registro de compras e entrada de estoque
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Nova Compra
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Investido",  value: fmtBRL(totalInvestido),    color: "text-foreground" },
          { label: "Em Perfumes",      value: fmtBRL(totalPerfumes),     color: "text-indigo-500" },
          { label: "Em Eletrônicos",   value: fmtBRL(totalEletronicos),  color: "text-sky-500" },
          { label: "Itens Comprados",  value: String(totalItens),        color: "text-foreground" },
        ].map((k) => (
          <div key={k.label} className="glass-card rounded-xl p-4">
            <p className="text-xs text-muted-foreground">{k.label}</p>
            <p className={`font-bold text-lg mt-0.5 ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9 h-9"
            placeholder="Buscar por produto, marca, fornecedor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={filtroTipo} onValueChange={(v) => setFiltroTipo(v as typeof filtroTipo)}>
          <SelectTrigger className="h-9 w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="perfume">Perfumes</SelectItem>
            <SelectItem value="eletronico">Eletrônicos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabela */}
      <div className="glass-card rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Produto</TableHead>
              <TableHead>Fornecedor</TableHead>
              <TableHead className="text-right">Qtd</TableHead>
              <TableHead className="text-right">Custo Unit.</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {compras.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-12">
                  {search ? "Nenhuma compra encontrada." : "Nenhuma compra registrada ainda."}
                </TableCell>
              </TableRow>
            ) : compras.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{c.data}</TableCell>
                <TableCell>
                  {c.tipo === "perfume"
                    ? <Badge variant="outline" className="text-indigo-500 border-indigo-200 gap-1"><Droplets className="h-3 w-3" />Perfume</Badge>
                    : <Badge variant="outline" className="text-sky-500 border-sky-200 gap-1"><Smartphone className="h-3 w-3" />Eletrônico</Badge>}
                </TableCell>
                <TableCell>
                  <p className="font-medium text-sm">{c.produto_nome}</p>
                  {c.marca && <p className="text-xs text-muted-foreground">{c.marca}</p>}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {c.fornecedor || "—"}
                  {c.origem && <span className="ml-1 text-xs text-muted-foreground/60">· {c.origem}</span>}
                </TableCell>
                <TableCell className="text-right text-sm">{c.quantidade}</TableCell>
                <TableCell className="text-right text-sm">{fmtBRL(c.preco_unit)}</TableCell>
                <TableCell className="text-right font-semibold text-sm">{fmtBRL(c.preco_brl)}</TableCell>
                <TableCell>
                  <ConfirmDelete
                    descricao={`compra de ${c.produto_nome}`}
                    onConfirm={async () => {
                      await deleteCompraAction(c.id);
                      toast.success("Compra removida.");
                    }}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Modal nova compra */}
      <Dialog open={open} onOpenChange={(v) => { if (!v) { setForm(FORM_VAZIO); setErrors({}); } setOpen(v); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-4 w-4" /> Nova Compra
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-1">
            {/* Tipo */}
            <div>
              <Label>Tipo de produto *</Label>
              <div className="flex gap-2 mt-1.5">
                {(["perfume", "eletronico"] as const).map((t) => (
                  <button key={t} type="button"
                    onClick={() => setF("tipo", t)}
                    className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-all
                      ${form.tipo === t
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-background text-muted-foreground hover:border-primary/40"}`}>
                    {t === "perfume" ? "Perfume" : "Eletrônico"}
                  </button>
                ))}
              </div>
            </div>

            {/* Produto + Marca */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Produto *</Label>
                <Input className={`h-10 mt-1 ${errors.produto_nome ? "border-destructive" : ""}`}
                  placeholder={form.tipo === "perfume" ? "Ex: Lattafa Pride" : "Ex: iPhone 15"}
                  value={form.produto_nome} onChange={(e) => setF("produto_nome", e.target.value)} />
                {errors.produto_nome && <p className="text-xs text-destructive mt-1">{errors.produto_nome}</p>}
              </div>
              <div>
                <Label>Marca</Label>
                <Input className="h-10 mt-1" placeholder="Ex: Lattafa, Apple..."
                  value={form.marca} onChange={(e) => setF("marca", e.target.value)} />
              </div>
            </div>

            {/* Quantidade */}
            <div className="max-w-[160px]">
              <Label>Quantidade *</Label>
              <Input className={`h-10 mt-1 ${errors.quantidade ? "border-destructive" : ""}`}
                type="number" min="1" placeholder="1"
                value={form.quantidade} onChange={(e) => setF("quantidade", e.target.value)} />
              {errors.quantidade && <p className="text-xs text-destructive mt-1">{errors.quantidade}</p>}
            </div>

            {/* Preços — perfume: USD+cotação / eletrônico: BRL direto */}
            {form.tipo === "perfume" ? (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Preço USD (total) *</Label>
                  <Input className={`h-10 mt-1 ${errors.preco_usd ? "border-destructive" : ""}`}
                    type="number" placeholder="0.00" inputMode="decimal"
                    value={form.preco_usd} onChange={(e) => setF("preco_usd", e.target.value)} />
                  {errors.preco_usd && <p className="text-xs text-destructive mt-1">{errors.preco_usd}</p>}
                </div>
                <div>
                  <Label>Cotação (R$/USD) *</Label>
                  <Input className={`h-10 mt-1 ${errors.cotacao ? "border-destructive" : ""}`}
                    type="number" placeholder="5.80" inputMode="decimal"
                    value={form.cotacao} onChange={(e) => setF("cotacao", e.target.value)} />
                  {errors.cotacao && <p className="text-xs text-destructive mt-1">{errors.cotacao}</p>}
                </div>
                {brlCalculado > 0 && (
                  <div className="col-span-2 rounded-lg bg-muted/40 p-3 flex justify-between text-sm">
                    <span className="text-muted-foreground">Custo total em BRL</span>
                    <span className="font-bold text-primary">{fmtBRL(brlCalculado)}</span>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <Label>Custo total (R$) *</Label>
                <Input className={`h-10 mt-1 ${errors.preco_brl ? "border-destructive" : ""}`}
                  type="number" placeholder="0.00" inputMode="decimal"
                  value={form.preco_brl} onChange={(e) => setF("preco_brl", e.target.value)} />
                {errors.preco_brl && <p className="text-xs text-destructive mt-1">{errors.preco_brl}</p>}
                {unitCalculado > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Custo por unidade: <span className="font-semibold text-foreground">{fmtBRL(unitCalculado)}</span>
                  </p>
                )}
              </div>
            )}

            {/* Fornecedor + Origem */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Fornecedor</Label>
                <Input className="h-10 mt-1" placeholder="Ex: Sheikh Perfumes"
                  value={form.fornecedor} onChange={(e) => setF("fornecedor", e.target.value)} />
              </div>
              <div>
                <Label>Origem</Label>
                <Input className="h-10 mt-1" placeholder="Ex: Dubai, Ali Express"
                  value={form.origem} onChange={(e) => setF("origem", e.target.value)} />
              </div>
            </div>

            {/* Data */}
            <div className="max-w-[200px]">
              <Label>Data da compra *</Label>
              <Input className={`h-10 mt-1 ${errors.data ? "border-destructive" : ""}`}
                type="date" value={form.data} onChange={(e) => setF("data", e.target.value)} />
              {errors.data && <p className="text-xs text-destructive mt-1">{errors.data}</p>}
            </div>

            {/* Observações */}
            <div>
              <Label>Observações <span className="text-muted-foreground text-xs">(opcional)</span></Label>
              <Textarea className="mt-1 min-h-[64px]" placeholder="Notas adicionais..."
                value={form.observacoes} onChange={(e) => setF("observacoes", e.target.value)} />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>Cancelar</Button>
            <Button onClick={handleSalvar} disabled={loading}>
              {loading ? "Salvando..." : "Registrar Compra"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}