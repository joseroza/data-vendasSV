import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle2, CalendarClock } from "lucide-react";

const mockCobrancas = [
  { id: 1, cliente: "Maria Silva", telefone: "(11) 99999-1111", produto: "Sauvage Dior", parcela: "3/6", valor: "R$ 450,00", vencimento: "05/03/2026", status: "pendente" },
  { id: 2, cliente: "João Santos", telefone: "(21) 98888-2222", produto: "iPhone 15 Pro", parcela: "2/4", valor: "R$ 1.800,00", vencimento: "05/03/2026", status: "atrasada" },
  { id: 3, cliente: "Ana Costa", telefone: "(31) 97777-3333", produto: "Good Girl", parcela: "1/3", valor: "R$ 216,67", vencimento: "05/03/2026", status: "pendente" },
  { id: 4, cliente: "Carlos Lima", telefone: "(41) 96666-4444", produto: "Samsung S24", parcela: "4/5", valor: "R$ 900,00", vencimento: "05/03/2026", status: "pendente" },
];

export default function Cobrancas() {
  const total = mockCobrancas.reduce((sum, c) => sum + parseFloat(c.valor.replace("R$ ", "").replace(".", "").replace(",", ".")), 0);

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="page-title flex items-center gap-2">
          <AlertTriangle className="h-6 w-6 text-warning" />
          Pendências / Cobranças
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Total a receber este mês: <span className="font-semibold text-foreground">R$ {total.toFixed(2).replace(".", ",")}</span>
        </p>
      </div>

      <div className="space-y-4">
        {mockCobrancas.map(c => (
          <div key={c.id} className="glass-card rounded-xl p-5 animate-fade-in">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{c.cliente}</h3>
                  <Badge variant={c.status === "atrasada" ? "destructive" : "secondary"}>
                    {c.status === "atrasada" ? "Atrasada" : "Pendente"}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{c.telefone}</p>
                <p className="text-sm">{c.produto} · Parcela {c.parcela}</p>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <CalendarClock className="h-3.5 w-3.5" /> Vencimento: {c.vencimento}
                </p>
              </div>
              <div className="text-right space-y-2">
                <p className="text-xl font-bold font-display">{c.valor}</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">Reagendar</Button>
                  <Button size="sm"><CheckCircle2 className="h-3.5 w-3.5 mr-1" />Marcar Paga</Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
