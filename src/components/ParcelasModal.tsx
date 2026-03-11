import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, CalendarDays, AlertCircle, Undo2 } from "lucide-react";
import { toast } from "sonner";
import type { Venda, Parcela } from "@/context/AppContext";
import { useApp } from "@/context/AppContext";

interface Props {
  venda:    Venda | null;
  onClose:  () => void;
}

function fmtBRL(v: number) { return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }

function isAtrasada(vencimento: string): boolean {
  const [d, m, y] = vencimento.split("/").map(Number);
  return new Date(y, m - 1, d) < new Date(new Date().setHours(0,0,0,0));
}

export function ParcelasModal({ venda, onClose }: Props) {
  const { marcarParcelaPaga, desmarcarParcelaPaga } = useApp();
  const [loading,    setLoading]    = useState<number | null>(null);
  const [desfazendo, setDesfazendo] = useState<number | null>(null);

  if (!venda) return null;

  const valorTotal  = venda.tipo === "perfume" ? venda.valorFinal : venda.precoVenda;

  // Parcela numero=0 é a entrada (paga no ato)
  const parcelaEntrada  = venda.parcelas.find((p) => p.numero === 0);
  const parcelasNormais = venda.parcelas.filter((p) => p.numero > 0);
  const numParcelasNorm = parcelasNormais.length;

  // Valor de cada parcela normal e da entrada
  // Se há entrada: entrada + N parcelas iguais dividem o total
  const numTotal = parcelaEntrada ? numParcelasNorm + 1 : numParcelasNorm;
  const valorParcelaNormal = numTotal > 0 ? valorTotal / numTotal : 0;
  const valorEntrada = parcelaEntrada ? valorParcelaNormal : 0;

  function getValorParcela(p: Parcela): number {
    return p.numero === 0 ? valorEntrada : valorParcelaNormal;
  }

  const totalPago     = venda.parcelas.filter((p) => p.status === "pago").reduce((s, p) => s + getValorParcela(p), 0);
  const totalPendente = venda.parcelas.filter((p) => p.status === "pendente").reduce((s, p) => s + getValorParcela(p), 0);

  const nomeProduto = venda.tipo === "perfume"
    ? venda.perfume.replace(/\|/g, " ").replace(/,/g, " /")
    : venda.produto.replace(/\|/g, " ").replace(/,/g, " /");

  async function handleDesfazer(parcela: Parcela) {
    setDesfazendo(parcela.numero);
    try {
      await desmarcarParcelaPaga(venda!.id, parcela.numero);
      toast.success(`Parcela ${parcela.numero}/${parcela.total} desmarcada.`);
    } catch {
      toast.error("Erro ao desfazer.");
    } finally {
      setDesfazendo(null);
    }
  }

  async function handlePagar(parcela: Parcela) {
    if (parcela.status === "pago") return;
    setLoading(parcela.numero);
    try {
      await marcarParcelaPaga(venda!.id, parcela.numero);
      toast.success(`Parcela ${parcela.numero}/${parcela.total} marcada como paga!`);
    } catch {
      toast.error("Erro ao marcar parcela.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <Dialog open={!!venda} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="w-[95vw] max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <CalendarDays className="h-4 w-4" /> Parcelas — {venda.cliente}
          </DialogTitle>
        </DialogHeader>

        {/* Resumo */}
        <div className="rounded-lg bg-muted/30 border border-border p-3 space-y-1 text-sm">
          <p className="text-muted-foreground text-xs leading-snug break-words">{nomeProduto}</p>
          <div className="grid grid-cols-3 gap-2 mt-2">
            <div>
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="font-semibold">{fmtBRL(valorTotal)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Recebido</p>
              <p className="font-semibold text-success">{fmtBRL(totalPago)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Pendente</p>
              <p className="font-semibold text-destructive">{fmtBRL(totalPendente)}</p>
            </div>
          </div>
        </div>

        {/* Lista de parcelas */}
        <div className="space-y-2">
          {venda.parcelas.map((parcela) => {
            const pago      = parcela.status === "pago";
            const atrasada  = !pago && isAtrasada(parcela.vencimento);
            const carregando = loading === parcela.numero;

            return (
              <div key={parcela.numero}
                className={`flex items-center gap-2 p-3 rounded-lg border transition-colors ${
                  pago
                    ? "border-success/20 bg-success/5"
                    : atrasada
                    ? "border-destructive/30 bg-destructive/5"
                    : "border-border bg-background hover:bg-muted/30"
                }`}>

                {/* Ícone status */}
                <div className="shrink-0">
                  {pago
                    ? <CheckCircle2 className="h-5 w-5 text-success" />
                    : atrasada
                    ? <AlertCircle className="h-5 w-5 text-destructive" />
                    : <Circle className="h-5 w-5 text-muted-foreground" />
                  }
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-semibold text-sm whitespace-nowrap">
                      {parcela.numero === 0 ? "Entrada" : `Parcela ${parcela.numero}/${parcela.total - 1}`}
                    </span>
                    {pago && (
                      <Badge variant="outline" className="text-[10px] h-4 px-1.5 text-success border-success/40">
                        Pago
                      </Badge>
                    )}
                    {atrasada && (
                      <Badge variant="destructive" className="text-[10px] h-4 px-1.5">
                        Atrasada
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 whitespace-nowrap">
                    {parcela.numero === 0 ? "Pago no ato da venda" : `Venc.: ${parcela.vencimento}`}
                  </p>
                </div>

                {/* Valor */}
                <div className="text-right shrink-0">
                  <p className={`font-semibold text-sm whitespace-nowrap ${pago ? "text-success" : atrasada ? "text-destructive" : ""}`}>
                    {fmtBRL(getValorParcela(parcela))}
                  </p>
                </div>

                {/* Botão ação */}
                {pago ? (
                  parcela.numero === 0 ? (
                    // Entrada não pode ser desfeita individualmente
                    <span className="text-xs text-muted-foreground px-2">Entrada</span>
                  ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-xs shrink-0 text-muted-foreground hover:text-destructive"
                    disabled={desfazendo === parcela.numero}
                    onClick={() => handleDesfazer(parcela)}
                  >
                    {desfazendo === parcela.numero
                      ? "..."
                      : <><Undo2 className="h-3 w-3 mr-1" />Desfazer</>
                    }
                  </Button>
                  )
                ) : (
                  <Button
                    size="sm"
                    variant={atrasada ? "destructive" : "outline"}
                    className="h-7 px-2 text-xs shrink-0"
                    disabled={carregando}
                    onClick={() => handlePagar(parcela)}
                  >
                    {carregando
                      ? "..."
                      : <><CheckCircle2 className="h-3 w-3 mr-1" />Pago</>
                    }
                  </Button>
                )}
              </div>
            );
          })}
        </div>

        {/* Progresso */}
        <div className="space-y-1.5">
          {(() => {
            const pagas = venda.parcelas.filter((p) => p.status === "pago").length;
            const total = venda.parcelas.length;
            const pct = total > 0 ? Math.round((pagas / total) * 100) : 0;
            return (
              <>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{pagas} de {total} pagas</span>
                  <span>{pct}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div className="h-full bg-success rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
              </>
            );
          })()}
        </div>

        <Button variant="outline" className="w-full" onClick={onClose}>Fechar</Button>
      </DialogContent>
    </Dialog>
  );
}