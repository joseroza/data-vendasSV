import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Calculator } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { toast } from "sonner";

function gerarParcelas(numParcelas: number, dataVenda: string) {
  const [y, m, d] = dataVenda.split("-").map(Number);
  return Array.from({ length: numParcelas }, (_, i) => {
    const dt = new Date(y, m - 1 + i, d);
    const dia = String(dt.getDate()).padStart(2, "0");
    const mes = String(dt.getMonth() + 1).padStart(2, "0");
    return {
      numero: i + 1,
      total: numParcelas,
      vencimento: `${dia}/${mes}/${dt.getFullYear()}`,
      status: "pendente" as const,
    };
  });
}

export default function NovaEletronicoVenda() {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();

  const [parcelado, setParcelado] = useState(false);
  const [isUsd, setIsUsd] = useState(false);
  const [precoUsd, setPrecoUsd] = useState("");
  const [cotacao, setCotacao] = useState("");
  const [precoCusto, setPrecoCusto] = useState("");
  const [precoVenda, setPrecoVenda] = useState("");
  const [produto, setProduto] = useState("");
  const [cliente, setCliente] = useState("");
  const [telefone, setTelefone] = useState("");
  const [numParcelas, setNumParcelas] = useState("3");
  const [dataVenda, setDataVenda] = useState(() => new Date().toISOString().split("T")[0]);
  const [observacoes, setObservacoes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const margem = state.margem;
  const usdNum = parseFloat(precoUsd) || 0;
  const cotacaoNum = parseFloat(cotacao) || 0;
  const brl = usdNum * cotacaoNum;
  const brlComMargem = brl * (1 + margem / 100);
  const custoNum = parseFloat(precoCusto) || 0;
  const vendaNum = parseFloat(precoVenda) || 0;
  const lucro = vendaNum - custoNum;

  function validate() {
    const e: Record<string, string> = {};
    if (!cliente.trim()) e.cliente = "Nome do cliente é obrigatório.";
    if (!telefone.trim()) e.telefone = "Telefone é obrigatório.";
    if (!produto.trim()) e.produto = "Informe o produto.";
    if (!custoNum || custoNum <= 0) e.precoCusto = "Informe o preço de custo.";
    if (!vendaNum || vendaNum <= 0) e.precoVenda = "Informe o preço de venda.";
    if (isUsd) {
      if (!usdNum || usdNum <= 0) e.precoUsd = "Informe o preço em USD.";
      if (!cotacaoNum || cotacaoNum <= 0) e.cotacao = "Informe a cotação.";
    }
    if (parcelado && (!numParcelas || parseInt(numParcelas) < 2)) {
      e.numParcelas = "Mínimo 2 parcelas.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSalvar() {
    if (!validate()) return;

    const parcelas = parcelado ? gerarParcelas(parseInt(numParcelas), dataVenda) : [];
    const [y, m, d] = dataVenda.split("-");
    const dataFormatada = `${d}/${m}/${y}`;

    dispatch({
      type: "ADD_VENDA",
      payload: {
        tipo: "eletronico",
        cliente: cliente.trim(),
        telefone: telefone.trim(),
        produto: produto.trim(),
        precoCusto: custoNum,
        precoVenda: vendaNum,
        lucro,
        isUsd,
        ...(isUsd ? { precoUsd: usdNum, cotacao: cotacaoNum } : {}),
        margemUsada: margem,
        tipoPagamento: parcelado ? "parcelado" : "avista",
        parcelas,
        observacoes,
        data: dataFormatada,
        status: parcelado ? "pendente" : "pago",
      },
    });

    toast.success("Venda registrada com sucesso!");
    navigate("/eletronicos/vendas");
  }

  const err = (key: string) =>
    errors[key] ? <p className="text-xs text-destructive mt-1">{errors[key]}</p> : null;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/eletronicos/vendas"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="page-title">Nova Venda — Eletrônicos</h1>
          <p className="text-muted-foreground text-sm mt-1">Registre uma nova venda de eletrônico</p>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="font-display text-lg">Dados do Cliente</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Nome do Cliente *</Label>
            <Input
              placeholder="Nome completo"
              value={cliente}
              onChange={(e) => setCliente(e.target.value)}
              className={errors.cliente ? "border-destructive" : ""}
            />
            {err("cliente")}
          </div>
          <div>
            <Label>Telefone *</Label>
            <Input
              placeholder="(00) 00000-0000"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              className={errors.telefone ? "border-destructive" : ""}
            />
            {err("telefone")}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="font-display text-lg">Produto e Valores</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Produto Vendido *</Label>
            <Input
              placeholder="Ex: iPhone 15 Pro, Samsung S24..."
              value={produto}
              onChange={(e) => setProduto(e.target.value)}
              className={errors.produto ? "border-destructive" : ""}
            />
            {err("produto")}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Preço de Custo (BRL) *</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={precoCusto}
                onChange={(e) => setPrecoCusto(e.target.value)}
                className={errors.precoCusto ? "border-destructive" : ""}
              />
              {err("precoCusto")}
            </div>
            <div>
              <Label>Preço de Venda (BRL) *</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={precoVenda}
                onChange={(e) => setPrecoVenda(e.target.value)}
                className={errors.precoVenda ? "border-destructive" : ""}
              />
              {err("precoVenda")}
            </div>
          </div>

          {custoNum > 0 && vendaNum > 0 && (
            <div className="p-3 rounded-lg bg-muted/50 border border-border/50 flex items-center gap-4">
              <Calculator className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                Lucro:{" "}
                <span className={`font-semibold font-display ${lucro >= 0 ? "text-success" : "text-destructive"}`}>
                  R$ {lucro.toFixed(2)}
                </span>
              </span>
            </div>
          )}

          <div className="flex items-center gap-3 p-3 rounded-lg border border-border/50">
            <Checkbox checked={isUsd} onCheckedChange={(c) => setIsUsd(!!c)} id="usd-check" />
            <Label htmlFor="usd-check" className="cursor-pointer">Venda em USD</Label>
          </div>

          {isUsd && (
            <div className="space-y-4 p-4 rounded-lg border border-primary/20 bg-primary/5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Preço em USD *</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={precoUsd}
                    onChange={(e) => setPrecoUsd(e.target.value)}
                    className={errors.precoUsd ? "border-destructive" : ""}
                  />
                  {err("precoUsd")}
                </div>
                <div>
                  <Label>Cotação USD/BRL *</Label>
                  <Input
                    type="number"
                    placeholder="5.80"
                    value={cotacao}
                    onChange={(e) => setCotacao(e.target.value)}
                    className={errors.cotacao ? "border-destructive" : ""}
                  />
                  {err("cotacao")}
                </div>
              </div>
              {usdNum > 0 && cotacaoNum > 0 && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">BRL Convertido</p>
                    <p className="font-semibold font-display">R$ {brl.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">BRL + {margem}%</p>
                    <p className="font-semibold font-display text-primary">R$ {brlComMargem.toFixed(2)}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="font-display text-lg">Pagamento</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Forma de Pagamento *</Label>
            <Select onValueChange={(v) => setParcelado(v === "parcelado")}>
              <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="avista">À Vista</SelectItem>
                <SelectItem value="parcelado">Parcelado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {parcelado && (
            <div className="space-y-4 p-4 rounded-lg border border-primary/20 bg-primary/5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Data da Venda *</Label>
                  <Input
                    type="date"
                    value={dataVenda}
                    onChange={(e) => setDataVenda(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Quantidade de Parcelas *</Label>
                  <Input
                    type="number"
                    min={2}
                    max={12}
                    placeholder="Ex: 3"
                    value={numParcelas}
                    onChange={(e) => setNumParcelas(e.target.value)}
                    className={errors.numParcelas ? "border-destructive" : ""}
                  />
                  {err("numParcelas")}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                As datas das parcelas serão geradas automaticamente.
              </p>
            </div>
          )}

          <div>
            <Label>Observações</Label>
            <Textarea
              placeholder="Notas sobre a venda..."
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button variant="outline" asChild><Link to="/eletronicos/vendas">Cancelar</Link></Button>
        <Button onClick={handleSalvar}>
          <Calculator className="h-4 w-4 mr-2" />
          Salvar Venda
        </Button>
      </div>
    </div>
  );
}
