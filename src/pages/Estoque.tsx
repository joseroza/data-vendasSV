import { useState, useMemo } from "react";
import { useApp } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Package, ArrowUpCircle, ArrowDownCircle, Settings2, Search,
  AlertTriangle, Droplets, Smartphone, TrendingUp,
} from "lucide-react";
import { toast } from "sonner";

function fmtBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const hoje = new Date().toISOString().split("T")[0];

export default function Estoque() {
  const { state, ajustarEstoqueAction } = useApp();
  const [search, setSearch]         = useState("");
  const [ajusteOpen, setAjusteOpen] = useState(false);
  const [ajusteLoading, setAjusteLoading] = useState(false);
  const [ajuste, setAjuste] = useState({
    tipo: "perfume" as "perfume" | "eletronico",
    produto_id: "",
    quantidade_nova: "",
    observacoes: "",
    data: hoje,
  });

  // ── Estoque atual dos catálogos ───────────────────────────────
  const estoquePerf = useMemo(() =>
    (state.catalogoPerfumes ?? []).map((p) => ({
      id: p.id,
      nome: `${p.marca ? p.marca + " — " : ""}${p.nome}`,
      tipo: "perfume" as const,
      estoque: (p as any).estoque_atual ?? p.quantidade ?? 0,
      precoCusto: (p as any).preco_custo_medio ?? p.precoBrl ?? 0,
      precoVenda: p.precoBrl,
    })),
    [state.catalogoPerfumes]);

  const estoqueElet = useMemo(() =>
    (state.catalogoEletronicos ?? []).map((p) => ({
      id: p.id,
      nome: p.nome,
      tipo: "eletronico" as const,
      estoque: (p as any).estoque_atual ?? 0,
      precoCusto: (p as any).preco_custo_medio ?? p.precoReferencia ?? 0,
      precoVenda: p.precoReferencia,
    })),
    [state.catalogoEletronicos]);

  const todosEstoque = useMemo(() => {
    const q = search.toLowerCase();
    return [...estoquePerf, ...estoqueElet].filter((p) =>
      !search || p.nome.toLowerCase().includes(q)
    );
  }, [estoquePerf, estoqueElet, search]);

  // ── Movimentações ────────────────────────────────────────────
  const movimentacoes = useMemo(() => {
    const q = search.toLowerCase();
    return (state.movimentacoes ?? []).filter((m) =>
      !search
      || m.produto_nome.toLowerCase().includes(q)
      || m.marca.toLowerCase().includes(q)
    );
  }, [state.movimentacoes, search]);

  // ── KPIs ─────────────────────────────────────────────────────
  const totalSkus     = todosEstoque.length;
  const totalUnidades = todosEstoque.reduce((s, p) => s + p.estoque, 0);
  const emFalta       = todosEstoque.filter((p) => p.estoque === 0).length;
  const estoqueBaixo  = todosEstoque.filter((p) => p.estoque > 0 && p.estoque <= 2).length;
  const valorEstoque  = todosEstoque.reduce((s, p) => s + p.estoque * p.precoCusto, 0);

  // ── Ajuste manual ─────────────────────────────────────────────
  const produtosAjuste = ajuste.tipo === "perfume"
    ? estoquePerf : estoqueElet;

  async function handleAjuste() {
    if (!ajuste.produto_id) { toast.error("Selecione o produto."); return; }
    const novaQtd = parseFloat(ajuste.quantidade_nova);
    if (isNaN(novaQtd) || novaQtd < 0) { toast.error("Quantidade inválida."); return; }
    setAjusteLoading(true);
    try {
      const produto = todosEstoque.find((p) => p.id === ajuste.produto_id);
      const [y, m, d] = ajuste.data.split("-");
      await ajustarEstoqueAction({
        tipo: ajuste.tipo,
        produto_id: ajuste.produto_id,
        produto_nome: produto?.nome ?? "",
        quantidade_anterior: produto?.estoque ?? 0,
        quantidade_nova: novaQtd,
        observacoes: ajuste.observacoes,
        data: `${d}/${m}/${y}`,
      });
      toast.success("Estoque ajustado com sucesso!");
      setAjusteOpen(false);
      setAjuste({ tipo: "perfume", produto_id: "", quantidade_nova: "", observacoes: "", data: hoje });
    } catch {
      toast.error("Erro ao ajustar estoque.");
    } finally {
      setAjusteLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Package className="h-5 w-5" /> Estoque
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Posição atual, movimentações e ajustes
          </p>
        </div>
        <Button variant="outline" onClick={() => setAjusteOpen(true)}>
          <Settings2 className="h-4 w-4 mr-2" /> Ajuste Manual
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "SKUs",           value: String(totalSkus),      color: "" },
          { label: "Total Unidades", value: String(totalUnidades),  color: "" },
          { label: "Sem Estoque",    value: String(emFalta),        color: emFalta > 0 ? "text-destructive" : "" },
          { label: "Estoque Baixo",  value: String(estoqueBaixo),   color: estoqueBaixo > 0 ? "text-warning" : "" },
          { label: "Valor em Estoque", value: fmtBRL(valorEstoque), color: "text-primary" },
        ].map((k) => (
          <div key={k.label} className="glass-card rounded-xl p-4">
            <p className="text-xs text-muted-foreground">{k.label}</p>
            <p className={`font-bold text-lg mt-0.5 ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Busca */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input className="pl-9 h-9" placeholder="Buscar produto..."
          value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="posicao">
        <TabsList className="mb-4">
          <TabsTrigger value="posicao">Posição Atual</TabsTrigger>
          <TabsTrigger value="historico">Histórico de Movimentações</TabsTrigger>
        </TabsList>

        {/* ── Posição atual ──────────────────────────────────────── */}
        <TabsContent value="posicao">
          <div className="glass-card rounded-xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Estoque</TableHead>
                  <TableHead className="text-right">Custo Médio</TableHead>
                  <TableHead className="text-right">Valor Total</TableHead>
                  <TableHead>Situação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {todosEstoque.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                      Nenhum produto no catálogo.
                    </TableCell>
                  </TableRow>
                ) : todosEstoque.map((p) => (
                  <TableRow key={`${p.tipo}-${p.id}`}>
                    <TableCell className="font-medium text-sm">{p.nome}</TableCell>
                    <TableCell>
                      {p.tipo === "perfume"
                        ? <Badge variant="outline" className="text-indigo-500 border-indigo-200 gap-1 text-[11px]"><Droplets className="h-3 w-3" />Perfume</Badge>
                        : <Badge variant="outline" className="text-sky-500 border-sky-200 gap-1 text-[11px]"><Smartphone className="h-3 w-3" />Eletrônico</Badge>}
                    </TableCell>
                    <TableCell className="text-right font-bold text-sm">{p.estoque}</TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">{fmtBRL(p.precoCusto)}</TableCell>
                    <TableCell className="text-right text-sm font-medium">{fmtBRL(p.estoque * p.precoCusto)}</TableCell>
                    <TableCell>
                      {p.estoque === 0 ? (
                        <span className="flex items-center gap-1 text-[11px] text-destructive font-medium">
                          <AlertTriangle className="h-3 w-3" />Sem estoque
                        </span>
                      ) : p.estoque <= 2 ? (
                        <span className="flex items-center gap-1 text-[11px] text-warning font-medium">
                          <AlertTriangle className="h-3 w-3" />Baixo
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[11px] text-success font-medium">
                          <TrendingUp className="h-3 w-3" />Normal
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* ── Histórico ─────────────────────────────────────────── */}
        <TabsContent value="historico">
          <div className="glass-card rounded-xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead>Operação</TableHead>
                  <TableHead>Origem</TableHead>
                  <TableHead className="text-right">Qtd</TableHead>
                  <TableHead className="text-right">Anterior</TableHead>
                  <TableHead className="text-right">Nova</TableHead>
                  <TableHead>Obs.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movimentacoes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-12">
                      Nenhuma movimentação registrada ainda.
                    </TableCell>
                  </TableRow>
                ) : movimentacoes.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{m.data}</TableCell>
                    <TableCell>
                      <p className="font-medium text-sm">{m.produto_nome}</p>
                      {m.marca && <p className="text-xs text-muted-foreground">{m.marca}</p>}
                    </TableCell>
                    <TableCell>
                      {m.operacao === "entrada" ? (
                        <span className="flex items-center gap-1 text-[11px] text-success font-medium">
                          <ArrowUpCircle className="h-3.5 w-3.5" />Entrada
                        </span>
                      ) : m.operacao === "saida" ? (
                        <span className="flex items-center gap-1 text-[11px] text-destructive font-medium">
                          <ArrowDownCircle className="h-3.5 w-3.5" />Saída
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[11px] text-muted-foreground font-medium">
                          <Settings2 className="h-3.5 w-3.5" />Ajuste
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground capitalize">
                      {m.origem === "compra" ? "Compra" : m.origem === "venda" ? "Venda" : "Manual"}
                    </TableCell>
                    <TableCell className={`text-right text-sm font-medium ${m.quantidade > 0 ? "text-success" : "text-destructive"}`}>
                      {m.quantidade > 0 ? `+${m.quantidade}` : m.quantidade}
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">{m.quantidade_anterior}</TableCell>
                    <TableCell className="text-right text-sm font-bold">{m.quantidade_nova}</TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[120px] truncate">{m.observacoes || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal Ajuste Manual */}
      <Dialog open={ajusteOpen} onOpenChange={setAjusteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings2 className="h-4 w-4" /> Ajuste Manual de Estoque
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-1">
            <div>
              <Label>Tipo</Label>
              <div className="flex gap-2 mt-1.5">
                {(["perfume", "eletronico"] as const).map((t) => (
                  <button key={t} type="button"
                    onClick={() => setAjuste((a) => ({ ...a, tipo: t, produto_id: "" }))}
                    className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-all
                      ${ajuste.tipo === t
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-background text-muted-foreground hover:border-primary/40"}`}>
                    {t === "perfume" ? "Perfume" : "Eletrônico"}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label>Produto *</Label>
              <Select value={ajuste.produto_id} onValueChange={(v) => setAjuste((a) => ({ ...a, produto_id: v }))}>
                <SelectTrigger className="h-10 mt-1">
                  <SelectValue placeholder="Selecione o produto" />
                </SelectTrigger>
                <SelectContent>
                  {produtosAjuste.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nome} (atual: {p.estoque})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Nova quantidade *</Label>
              <Input className="h-10 mt-1" type="number" min="0" placeholder="0"
                value={ajuste.quantidade_nova}
                onChange={(e) => setAjuste((a) => ({ ...a, quantidade_nova: e.target.value }))} />
              <p className="text-xs text-muted-foreground mt-1">
                Informe a quantidade correta atual no estoque físico.
              </p>
            </div>

            <div>
              <Label>Data</Label>
              <Input className="h-10 mt-1" type="date"
                value={ajuste.data}
                onChange={(e) => setAjuste((a) => ({ ...a, data: e.target.value }))} />
            </div>

            <div>
              <Label>Motivo <span className="text-muted-foreground text-xs">(opcional)</span></Label>
              <Textarea className="mt-1 min-h-[60px]" placeholder="Ex: Contagem física, perda..."
                value={ajuste.observacoes}
                onChange={(e) => setAjuste((a) => ({ ...a, observacoes: e.target.value }))} />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setAjusteOpen(false)} disabled={ajusteLoading}>Cancelar</Button>
            <Button onClick={handleAjuste} disabled={ajusteLoading}>
              {ajusteLoading ? "Salvando..." : "Salvar Ajuste"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}