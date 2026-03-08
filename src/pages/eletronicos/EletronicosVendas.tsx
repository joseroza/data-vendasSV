import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Plus, Search, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { toast } from "sonner";
import { useState } from "react";

export default function EletronicosVendas() {
  const { state, dispatch } = useApp();
  const [search, setSearch] = useState("");

  const vendas = state.vendas
    .filter((v) => v.tipo === "eletronico")
    .filter((v) =>
      v.cliente.toLowerCase().includes(search.toLowerCase()) ||
      (v.tipo === "eletronico" && v.produto.toLowerCase().includes(search.toLowerCase()))
    );

  function marcarPago(id: string, cliente: string) {
    dispatch({ type: "MARCAR_VENDA_PAGA", payload: id });
    toast.success(`Venda de ${cliente} marcada como paga!`);
  }

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Vendas — Eletrônicos</h1>
          <p className="text-muted-foreground text-sm mt-1">{vendas.length} vendas registradas</p>
        </div>
        <Button asChild>
          <Link to="/eletronicos/nova-venda"><Plus className="h-4 w-4 mr-2" />Nova Venda</Link>
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por cliente ou produto..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="glass-card rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Produto</TableHead>
              <TableHead>Custo</TableHead>
              <TableHead>Venda</TableHead>
              <TableHead>Lucro</TableHead>
              <TableHead>Pagamento</TableHead>
              <TableHead>Status</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vendas.map((v) => {
              if (v.tipo !== "eletronico") return null;
              const pagas = v.parcelas.filter((p) => p.status === "pago").length;
              const totalParcelas = v.parcelas.length;
              return (
                <TableRow key={v.id}>
                  <TableCell className="text-sm">{v.data}</TableCell>
                  <TableCell className="font-medium">{v.cliente}</TableCell>
                  <TableCell>{v.produto}</TableCell>
                  <TableCell className="text-sm">
                    R$ {v.precoCusto.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="font-medium">
                    R$ {v.precoVenda.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-success font-medium">
                    R$ {v.lucro.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell>
                    <div>
                      <Badge variant="secondary">
                        {v.tipoPagamento === "parcelado" ? "Parcelado" : "À Vista"}
                      </Badge>
                      {v.tipoPagamento === "parcelado" && (
                        <p className="text-xs text-muted-foreground mt-1">{pagas}/{totalParcelas} pagas</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={v.status === "pago" ? "default" : "destructive"}
                      className={v.status === "pago" ? "bg-success text-success-foreground" : ""}
                    >
                      {v.status === "pago" ? "Pago" : "Pendente"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {v.status !== "pago" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => marcarPago(v.id, v.cliente)}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1 text-success" />
                        Pagar
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
            {vendas.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                  Nenhuma venda encontrada.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
