import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useApp, Cliente } from "@/context/AppContext";
import { toast } from "sonner";

interface FormState {
  nome: string;
  telefone: string;
  email: string;
  notas: string;
}

const emptyForm: FormState = { nome: "", telefone: "", email: "", notas: "" };

export default function Clientes() {
  const { state, dispatch } = useApp();
  const [search, setSearch] = useState("");
  const [openAdd, setOpenAdd] = useState(false);
  const [editando, setEditando] = useState<Cliente | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<Partial<FormState>>({});

  const filtered = state.clientes.filter(
    (c) =>
      c.nome.toLowerCase().includes(search.toLowerCase()) ||
      c.telefone.includes(search)
  );

  function validate(): boolean {
    const e: Partial<FormState> = {};
    if (!form.nome.trim()) e.nome = "Nome é obrigatório.";
    if (!form.telefone.trim()) e.telefone = "Telefone é obrigatório.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleAdd() {
    if (!validate()) return;
    dispatch({ type: "ADD_CLIENTE", payload: form });
    toast.success("Cliente cadastrado com sucesso!");
    setForm(emptyForm);
    setErrors({});
    setOpenAdd(false);
  }

  function handleEdit(c: Cliente) {
    setEditando(c);
    setForm({ nome: c.nome, telefone: c.telefone, email: c.email, notas: c.notas });
    setErrors({});
  }

  function handleUpdate() {
    if (!validate() || !editando) return;
    dispatch({ type: "UPDATE_CLIENTE", payload: { ...editando, ...form } });
    toast.success("Cliente atualizado!");
    setEditando(null);
    setForm(emptyForm);
  }

  function handleDelete(id: string, nome: string) {
    dispatch({ type: "DELETE_CLIENTE", payload: id });
    toast.success(`Cliente "${nome}" removido.`);
  }

  const field = (key: keyof FormState, label: string, placeholder: string, type = "text") => (
    <div>
      <Label>{label}</Label>
      <Input
        type={type}
        placeholder={placeholder}
        value={form[key]}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        className={errors[key] ? "border-destructive" : ""}
      />
      {errors[key] && <p className="text-xs text-destructive mt-1">{errors[key]}</p>}
    </div>
  );

  const FormContent = () => (
    <div className="space-y-4">
      {field("nome", "Nome *", "Nome completo")}
      {field("telefone", "Telefone *", "(00) 00000-0000")}
      {field("email", "Email", "email@exemplo.com", "email")}
      <div>
        <Label>Observações</Label>
        <Textarea
          placeholder="Notas sobre o cliente..."
          value={form.notas}
          onChange={(e) => setForm((f) => ({ ...f, notas: e.target.value }))}
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Clientes</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {state.clientes.length} clientes cadastrados
          </p>
        </div>

        <Dialog open={openAdd} onOpenChange={(o) => { setOpenAdd(o); if (!o) { setForm(emptyForm); setErrors({}); } }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Novo Cliente</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-display">Novo Cliente</DialogTitle>
            </DialogHeader>
            <FormContent />
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpenAdd(false)}>Cancelar</Button>
              <Button onClick={handleAdd}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome ou telefone..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="glass-card rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Observações</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.nome}</TableCell>
                <TableCell className="text-sm">{c.telefone}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{c.email || "—"}</TableCell>
                <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                  {c.notas ? (
                    <Badge variant="secondary" className="text-xs">{c.notas}</Badge>
                  ) : "—"}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2 justify-end">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(c)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(c.id, c.nome)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  Nenhum cliente encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialog editar */}
      <Dialog open={!!editando} onOpenChange={(o) => { if (!o) { setEditando(null); setForm(emptyForm); setErrors({}); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Editar Cliente</DialogTitle>
          </DialogHeader>
          <FormContent />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditando(null)}>Cancelar</Button>
            <Button onClick={handleUpdate}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
