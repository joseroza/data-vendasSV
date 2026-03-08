import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Calculator } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { toast } from "sonner";

function gerarParcelas(
  numParcelas: number,
  dataVenda: string,
  total: number
) {
  const [d, m, y] = dataVenda.split("-").map(Number);
  return Array.from({ length: numParcelas }, (_, i) => {
    const dt = new Date(y, m - 1 + i, d);
    const dia = String(dt.getDate()).padStart(2, "0");
    const mes = String(dt.getMonth() + 1).padStart(2, "0");
    const ano = dt.getFullYear();
    return {
      numero: i + 1,
      total: numParcelas,
      vencimento: `${dia}/${mes}/${ano}`,
      status: "pendente" as const,
    };
  });
}

export default function NovaPerfumeVenda() {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();

  const [parcelado, setParcelado] = useState(false);
  const [precoUsd, setPrecoUsd] = useState("");
  const [cotacao, setCotacao] = useState("");
  const [cliente, setCliente] = useState("");
  const [telefone, setTelefone] = useState("");
  const [perfume, setPerfume] = useState("");
  const [numParcelas, setNumParcelas] = useState("3");
  const [dataVenda, setDataVenda] = useState(() => new Date().toISOString().split("T")[0]);
  const [observacoes, setObservacoes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const margem = state.margem;
  const usdNum = parseFloat(precoUsd) || 0;
  const cotacaoNum = parseFloat(cotacao) || 0;
  const usdComMargem = usdNum * (1 + margem / 100);
  const brl = usdNum * cotacaoNum;
  const brlComMargem = brl * (1 + margem / 100);

  function validate() {
    const e: Record<string, string> = {};
    if (!cliente.trim()) e.cliente = "Nome do cliente é obrigatório.";
    if (!telefone.trim()) e.telefone = "Telefone é obrigatório.";
    if (!perfume.trim()) e.perfume = "Informe o perfume.";
    if (!usdNum || usdNum <= 0) e.precoUsd = "Informe o preço em USD.";
    if (!cotacaoNum || cotacaoNum <= 0) e.cotacao = "Informe a cotação USD/BRL.";
    if (parcelado && (!numParcelas || parseInt(numParcelas) < 2)) {
      e.numParcelas = "Mínimo 2 parcelas.";
    }
    if (parcelado && !dataVenda) e.dataVenda = "Informe a data da venda.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSalvar() {
    if (!validate()) return;

    const parcelas = parcelado
      ? gerarParcelas(parseInt(numParcelas), dataVenda, brlComMargem)
      : [];

    const [d, m, y] = dataVenda.split("-");
    const dataFormatada = `${d}/${m}/${y}`;

    dispatch({
      type: "ADD_VENDA",
      payload: {
        tipo: "perfume",
        cliente: cliente.trim(),
        telefone: telefone.trim(),
        perfume: perfume.trim(),
        precoUsd: usdNum,
        cotacao: cotacaoNum,
        precoBrl: brl,
        margemUsada: margem,
        valorFinal: brlComMargem,
        tipoPagamento: parcelado ? "parcelado" : "avista",
        parcelas,
        observacoes,
        data: dataFormatada,
        status: parcelado ? "pendente" : "pago",
      },
    });

    toast.success("Venda registrada com sucesso!");
    navigate("/perfumes/vendas");
  }

  const err = (key: string) =>
    errors[key] ? <p className="text-xs text-destructive mt-1">{errors[key]}</p> : null;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/perfumes/vendas"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="page-title">Nova Venda — Perfumes</h1>
          <p className="text-muted-foreground text-sm mt-1">Registre uma nova venda de perfume</p>
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
            <Label>Perfume Vendido *</Label>
            <Input
              placeholder="Ex: Sauvage Dior, Bleu de Chanel..."
              value={perfume}
              onChange={(e) => setPerfume(e.target.value)}
              className={errors.perfume ? "border-destructive" : ""}
            />
            {err("perfume")}
          </div>

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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 rounded-lg bg-muted/50 border border-border/50">
              <div>
                <p className="text-xs text-muted-foreground">USD + {margem}%</p>
                <p className="font-semibold font-display">${usdComMargem.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">BRL</p>
                <p className="font-semibold font-display">R$ {brl.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">BRL + {margem}%</p>
                <p className="font-semibold font-display text-primary">R$ {brlComMargem.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Lucro estimado</p>
                <p className="font-semibold font-display text-success">
                  R$ {(brlComMargem - brl).toFixed(2)}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="font-display text-lg">Pagamento</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Switch checked={parcelado} onCheckedChange={setParcelado} id="parcelado" />
            <Label htmlFor="parcelado" className="cursor-pointer">Parcelado</Label>
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
                    className={errors.dataVenda ? "border-destructive" : ""}
                  />
                  {err("dataVenda")}
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
                As datas das parcelas serão geradas automaticamente a partir da data da venda.
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
        <Button variant="outline" asChild><Link to="/perfumes/vendas">Cancelar</Link></Button>
        <Button onClick={handleSalvar}>
          <Calculator className="h-4 w-4 mr-2" />
          Salvar Venda
        </Button>
      </div>
    </div>
  );
}
