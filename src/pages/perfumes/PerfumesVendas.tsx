import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Eye } from "lucide-react";
import { Link } from "react-router-dom";

const mockVendas = [
  { id: 1, cliente: "Maria Silva", perfume: "Sauvage Dior", valorBrl: "R$ 890,00", pagamento: "Parcelado", parcelas: "2/4 pagas", status: "pendente", data: "15/01/2026" },
  { id: 2, cliente: "Pedro Alves", perfume: "Bleu de Chanel", valorBrl: "R$ 720,00", pagamento: "À Vista", parcelas: "—", status: "pago", data: "03/03/2026" },
  { id: 3, cliente: "Ana Costa", perfume: "Good Girl", valorBrl: "R$ 650,00", pagamento: "Parcelado", parcelas: "1/3 pagas", status: "pendente", data: "10/02/2026" },
  { id: 4, cliente: "João Santos", perfume: "212 VIP", valorBrl: "R$ 580,00", pagamento: "Parcelado", parcelas: "3/3 pagas", status: "pago", data: "05/12/2025" },
];

export default function PerfumesVendas() {
  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Vendas — Perfumes</h1>
          <p className="text-muted-foreground text-sm mt-1">{mockVendas.length} vendas registradas</p>
        </div>
        <Button asChild><Link to="/perfumes/nova-venda"><Plus className="h-4 w-4 mr-2" />Nova Venda</Link></Button>
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
            {mockVendas.map(v => (
              <TableRow key={v.id}>
                <TableCell className="text-sm">{v.data}</TableCell>
                <TableCell className="font-medium">{v.cliente}</TableCell>
                <TableCell>{v.perfume}</TableCell>
                <TableCell className="font-medium">{v.valorBrl}</TableCell>
                <TableCell><Badge variant="secondary">{v.pagamento}</Badge></TableCell>
                <TableCell className="text-sm">{v.parcelas}</TableCell>
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
