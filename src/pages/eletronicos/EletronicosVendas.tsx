import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Eye } from "lucide-react";
import { Link } from "react-router-dom";

const mockVendas = [
  { id: 1, cliente: "Carlos Lima", produto: "iPhone 15 Pro", custo: "R$ 5.800,00", venda: "R$ 7.200,00", lucro: "R$ 1.400,00", pagamento: "Parcelado", parcelas: "2/4 pagas", status: "pendente", data: "20/01/2026" },
  { id: 2, cliente: "Lucia Ferreira", produto: "Samsung S24 Ultra", custo: "R$ 3.500,00", venda: "R$ 4.500,00", lucro: "R$ 1.000,00", pagamento: "À Vista", parcelas: "—", status: "pago", data: "02/03/2026" },
  { id: 3, cliente: "Roberto Dias", produto: "AirPods Pro", custo: "R$ 1.200,00", venda: "R$ 1.600,00", lucro: "R$ 400,00", pagamento: "À Vista", parcelas: "—", status: "pago", data: "25/02/2026" },
];

export default function EletronicosVendas() {
  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Vendas — Eletrônicos</h1>
          <p className="text-muted-foreground text-sm mt-1">{mockVendas.length} vendas registradas</p>
        </div>
        <Button asChild><Link to="/eletronicos/nova-venda"><Plus className="h-4 w-4 mr-2" />Nova Venda</Link></Button>
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
            {mockVendas.map(v => (
              <TableRow key={v.id}>
                <TableCell className="text-sm">{v.data}</TableCell>
                <TableCell className="font-medium">{v.cliente}</TableCell>
                <TableCell>{v.produto}</TableCell>
                <TableCell className="text-sm">{v.custo}</TableCell>
                <TableCell className="font-medium">{v.venda}</TableCell>
                <TableCell className="text-success font-medium">{v.lucro}</TableCell>
                <TableCell><Badge variant="secondary">{v.pagamento}</Badge></TableCell>
                <TableCell>
                  <Badge variant={v.status === "pago" ? "default" : "destructive"} className={v.status === "pago" ? "bg-success text-success-foreground" : ""}>
                    {v.status === "pago" ? "Pago" : "Pendente"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
