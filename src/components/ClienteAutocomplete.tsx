import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, UserPlus } from "lucide-react";
import { useApp } from "@/context/AppContext";

interface Props {
  value:       string;
  telefone:    string;
  onChange:    (nome: string, telefone: string) => void;
  error?:      string;
  label?:      string;
}

export function ClienteAutocomplete({ value, telefone, onChange, error, label = "Cliente *" }: Props) {
  const { state } = useApp();
  const [open,    setOpen]    = useState(false);
  const [busca,   setBusca]   = useState(value);
  const containerRef          = useRef<HTMLDivElement>(null);

  const sugestoes = state.clientes
    .filter((c) => c.nome.toLowerCase().includes(busca.toLowerCase()) && busca.length > 0)
    .slice(0, 6);

  const isNovo = busca.trim().length > 0 && !state.clientes.some(
    (c) => c.nome.toLowerCase() === busca.trim().toLowerCase()
  );

  // Fecha ao clicar fora
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        // Se digitou mas não selecionou, mantém o que digitou
        onChange(busca, telefone);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [busca, telefone]);

  function handleInput(v: string) {
    setBusca(v);
    onChange(v, telefone); // limpa o telefone se trocar de cliente
    setOpen(true);
  }

  function selecionar(nome: string, tel: string) {
    setBusca(nome);
    onChange(nome, tel);
    setOpen(false);
  }

  return (
    <div className="space-y-1" ref={containerRef}>
      <Label>{label}</Label>
      <div className="relative">
        <Input
          className={`h-10 pr-8 ${error ? "border-destructive" : ""}`}
          placeholder="Digite o nome do cliente..."
          value={busca}
          onChange={(e) => handleInput(e.target.value)}
          onFocus={() => busca.length > 0 && setOpen(true)}
          autoComplete="off"
        />
        <User className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />

        {/* Dropdown */}
        {open && (sugestoes.length > 0 || isNovo) && (
          <div className="absolute z-50 left-0 right-0 top-[calc(100%+4px)] rounded-lg border border-border bg-popover shadow-lg overflow-hidden">
            {sugestoes.map((c) => (
              <button
                key={c.id}
                type="button"
                onMouseDown={() => selecionar(c.nome, c.telefone)}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-muted transition-colors text-left"
              >
                <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium truncate">{c.nome}</p>
                  {c.telefone && <p className="text-xs text-muted-foreground">{c.telefone}</p>}
                </div>
              </button>
            ))}
            {isNovo && (
              <button
                type="button"
                onMouseDown={() => { setOpen(false); onChange(busca, telefone); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-primary/5 border-t border-border text-primary transition-colors text-left"
              >
                <UserPlus className="h-3.5 w-3.5 shrink-0" />
                <span>Novo cliente: <strong>"{busca}"</strong></span>
              </button>
            )}
          </div>
        )}
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
