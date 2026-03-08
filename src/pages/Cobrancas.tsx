import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle2, CalendarClock } from "lucide-react";
import { useApp, useCobrancas } from "@/context/AppContext";
import { toast } from "sonner";

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function Cobrancas() {
  const { dispatch } = useApp();
  const cobrancas = useCobrancas();

  const total = cobrancas.reduce((s, c) => s + c.valor, 0);

  function marcarPaga(vendaId: string, numeroParcela: number, cliente: string) {
    dispatch({ type: "MARCAR_PARCELA_PAGA", payload: { vendaId, numeroParcela } });
    toast.success(`Parcela de ${cliente} marcada como paga!`);
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="page-title flex items-center gap-2">
          <AlertTriangle className="h-6 w-6 text-warning" />
          Pendências / Cobranças
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Total a receber:{" "}
          <span className="font-semibold text-foreground">{formatBRL(total)}</span>
        </p>
      </div>

      {cobrancas.length === 0 ? (
        <div className="glass-card rounded-xl p-12 text-center animate-fade-in">
          <CheckCircle2 className="h-12 w-12 text-success mx-auto mb-4" />
          <h2 className="text-lg font-semibold font-display">Tudo em dia!</h2>
          <p className="text-muted-foreground text-sm mt-1">Não há cobranças pendentes no momento.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {cobrancas.map((c, i) => (
            <div key={i} className="glass-card rounded-xl p-5 animate-fade-in">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{c.cliente}</h3>
                    <Badge variant={c.status === "atrasado" ? "destructive" : "secondary"}>
                      {c.status === "atrasado" ? "Atrasada" : "Pendente"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{c.telefone}</p>
                  <p className="text-sm">{c.produto} · Parcela {c.parcela}</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <CalendarClock className="h-3.5 w-3.5" /> Vencimento: {c.vencimento}
                  </p>
                </div>
                <div className="text-right space-y-2">
                  <p className="text-xl font-bold font-display">{formatBRL(c.valor)}</p>
                  <Button
                    size="sm"
                    onClick={() => marcarPaga(c.vendaId, c.numeroParcela, c.cliente)}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                    Marcar Paga
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
