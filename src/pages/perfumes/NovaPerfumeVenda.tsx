import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Calculator } from "lucide-react";
import { Link } from "react-router-dom";

export default function NovaPerfumeVenda() {
  const [parcelado, setParcelado] = useState(false);
  const [precoUsd, setPrecoUsd] = useState("");
  const [cotacao, setCotacao] = useState("");
  const margem = 20;

  const usdNum = parseFloat(precoUsd) || 0;
  const cotacaoNum = parseFloat(cotacao) || 0;
  const usdComMargem = usdNum * (1 + margem / 100);
  const brl = usdNum * cotacaoNum;
  const brlComMargem = brl * (1 + margem / 100);

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
          <div><Label>Nome do Cliente *</Label><Input placeholder="Nome completo" /></div>
          <div><Label>Telefone *</Label><Input placeholder="(00) 00000-0000" /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="font-display text-lg">Produto e Valores</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div><Label>Perfume Vendido *</Label><Input placeholder="Ex: Sauvage Dior, Bleu de Chanel..." /></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Preço em USD *</Label>
              <Input type="number" placeholder="0.00" value={precoUsd} onChange={e => setPrecoUsd(e.target.value)} />
            </div>
            <div>
              <Label>Cotação USD/BRL *</Label>
              <Input type="number" placeholder="5.80" value={cotacao} onChange={e => setCotacao(e.target.value)} />
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
              <div className="flex items-center gap-1">
                <Calculator className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Margem: {margem}%</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="font-display text-lg">Pagamento</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Forma de Pagamento *</Label>
            <Select onValueChange={v => setParcelado(v === "parcelado")}>
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
                  <Input type="date" />
                </div>
                <div>
                  <Label>Quantidade de Parcelas *</Label>
                  <Input type="number" min={2} max={12} placeholder="Ex: 3" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                As datas das parcelas serão geradas automaticamente nos meses seguintes.
              </p>
            </div>
          )}

          <div><Label>Observações</Label><Textarea placeholder="Notas sobre a venda..." /></div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button variant="outline" asChild><Link to="/perfumes/vendas">Cancelar</Link></Button>
        <Button>Salvar Venda</Button>
      </div>
    </div>
  );
}
