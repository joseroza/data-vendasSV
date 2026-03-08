import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Plus, Search, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { toast } from "sonner";
import { useState } from "react";

export default function PerfumesVendas() {
  const { state, dispatch } = useApp();
  const [search, setSearch] = useState("");

  const vendas = state.vendas
    .filter((v) => v.tipo === "perfume")
    .filter((v) =>
      v.cliente.toLowerCase().includes(search.toLowerCase()) ||
      (v.tipo === "perfume" && v.perfume.toLowerCase().includes(search.toLowerCase()))
    );

  function marcarPago(id: string, cliente: string) {
    dispatch({ type: "MARCAR_VENDA_PAGA", payload: id });
    toast.success(`Venda de ${cliente} marcada como paga!`);
  }

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Vendas — Perfumes</h1>
          <p className="text-muted-foreground text-sm mt-1">{vendas.length} vendas registradas</p>
        </div>
        <Button asChild>
          <Link to="/perfumes/nova-venda"><Plus className="h-4 w-4 mr-2" />Nova Venda</Link>
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por cliente ou perfume..."
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
              <TableHead>Perfume</TableHead>
              <TableHead>Valor (BRL)</TableHead>
              <TableHead>Pagamento</TableHead>
              <TableHead>Parcelas</TableHead>
              <TableHead>Status</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vendas.map((v) => {
              if (v.tipo !== "perfume") return null;
              const pagas = v.parcelas.filter((p) => p.status === "pago").length;
              const totalParcelas = v.parcelas.length;
              return (
                <TableRow key={v.id}>
                  <TableCell className="text-sm">{v.data}</TableCell>
                  <TableCell className="font-medium">{v.cliente}</TableCell>
                  <TableCell>{v.perfume}</TableCell>
                  <TableCell className="font-medium">
                    R$ {v.valorFinal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {v.tipoPagamento === "parcelado" ? "Parcelado" : "À Vista"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {v.tipoPagamento === "parcelado" ? `${pagas}/${totalParcelas} pagas` : "—"}
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
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
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
