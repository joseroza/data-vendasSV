import {
  createContext, useContext, ReactNode,
  useEffect, useState, useCallback, useRef,
} from "react";
import {
  supabase,
  fetchClientes, insertCliente, updateCliente, deleteCliente,
  fetchVendas, insertVenda, updateVenda, deleteVenda,
  updateParcelaStatus, updateVendaStatus, recriarParcelas,
  registrarPagamentoParcela, desfazerPagamentoParcela,
  fetchCatalogoPerfumes, insertProdutoPerfume, deleteProdutoPerfume,
  fetchCatalogoEletronicos, insertProdutoEletronico, deleteProdutoEletronico,
  fetchMargem, saveMargem,
  fetchVendedores, insertVendedor, deleteVendedor,
  fetchCompras, insertCompra, deleteCompra,
  fetchMovimentacoes, insertMovimentacao,
  updateEstoquePerfume, updateEstoqueEletronico,
} from "@/lib/supabase";
import type { Session } from "@supabase/supabase-js";

export type StatusPagamento = "pago" | "pendente" | "atrasado";
export type TipoPagamento   = "avista" | "parcelado";

export interface Parcela {
  numero: number; total: number; vencimento: string;
  status: StatusPagamento; valorPago?: number;
}
export interface VendaPerfume {
  id: string; tipo: "perfume"; cliente: string; telefone: string; vendedor: string;
  perfume: string; precoUsd: number; cotacao: number; precoBrl: number;
  margemUsada: number; valorFinal: number; tipoPagamento: TipoPagamento;
  valorEntrada?: number; parcelas: Parcela[];
  observacoes: string; data: string; status: StatusPagamento;
}
export interface VendaEletronico {
  id: string; tipo: "eletronico"; cliente: string; telefone: string; vendedor: string;
  produto: string; precoCusto: number; precoVenda: number; lucro: number;
  isUsd: boolean; precoUsd?: number; cotacao?: number; margemUsada: number;
  tipoPagamento: TipoPagamento; valorEntrada?: number; parcelas: Parcela[];
  observacoes: string; data: string; status: StatusPagamento;
}
export type Venda = VendaPerfume | VendaEletronico;
export interface Cliente    { id: string; nome: string; telefone: string; email: string; notas: string; }
export interface Vendedor   { id: string; nome: string; email: string; ativo: boolean; }
export interface ProdutoPerfume {
  id: string; marca: string; nome: string; quantidade: number;
  precoUsd: number; precoBrl: number;
  estoqueAtual?: number; precoCustoMedio?: number;
}
export interface ProdutoEletronico {
  id: string; nome: string; precoReferencia: number;
  estoqueAtual?: number; precoCustoMedio?: number;
}
export interface Compra {
  id: string; tipo: "perfume" | "eletronico"; produto_id?: string;
  produto_nome: string; marca: string; quantidade: number;
  preco_usd: number; cotacao: number; preco_brl: number; preco_unit: number;
  fornecedor: string; origem: string; data: string; observacoes: string;
}
export interface Movimentacao {
  id: string; tipo: "perfume" | "eletronico"; produto_id?: string;
  produto_nome: string; marca: string;
  operacao: "entrada" | "saida" | "ajuste";
  origem: "compra" | "venda" | "ajuste_manual"; ref_id?: string;
  quantidade: number; quantidade_anterior: number; quantidade_nova: number;
  preco_unit: number; data: string; observacoes: string;
}
export interface AjusteEstoque {
  tipo: "perfume" | "eletronico"; produto_id: string; produto_nome: string;
  quantidade_anterior: number; quantidade_nova: number;
  observacoes: string; data: string;
}
export interface AppState {
  margem: number; clientes: Cliente[]; vendas: Venda[];
  vendedores: Vendedor[]; catalogoPerfumes: ProdutoPerfume[];
  catalogoEletronicos: ProdutoEletronico[];
  compras: Compra[]; movimentacoes: Movimentacao[];
  loading: boolean; session: Session | null;
}

type UpdateVendaPerfumeFields    = Partial<Omit<VendaPerfume, "id" | "tipo">>;
type UpdateVendaEletronicoFields = Partial<Omit<VendaEletronico, "id" | "tipo">>;
export type UpdateVendaFields    = UpdateVendaPerfumeFields | UpdateVendaEletronicoFields;

type DbRow = Record<string, unknown> & { parcelas?: Record<string, unknown>[] };

function dbToVenda(v: DbRow): Venda {
  const parcelas: Parcela[] = (v.parcelas ?? []).map((p) => ({
    valorPago: (p.valor_pago ?? 0) as number, numero: p.numero as number,
    total: p.total as number, vencimento: p.vencimento as string,
    status: p.status as StatusPagamento,
  }));
  if (v.tipo === "perfume") {
    return {
      id: v.id as string, tipo: "perfume", cliente: v.cliente as string,
      telefone: (v.telefone ?? "") as string, vendedor: (v.vendedor ?? "") as string,
      perfume: (v.perfume ?? "") as string, precoUsd: (v.preco_usd ?? 0) as number,
      cotacao: (v.cotacao ?? 0) as number, precoBrl: (v.preco_brl ?? 0) as number,
      margemUsada: (v.margem_usada ?? 20) as number, valorFinal: (v.valor_final ?? 0) as number,
      valorEntrada: (v.valor_entrada ?? 0) as number,
      tipoPagamento: v.tipo_pagamento as TipoPagamento, parcelas,
      observacoes: (v.observacoes ?? "") as string, data: v.data as string,
      status: v.status as StatusPagamento,
    };
  }
  return {
    id: v.id as string, tipo: "eletronico", cliente: v.cliente as string,
    telefone: (v.telefone ?? "") as string, vendedor: (v.vendedor ?? "") as string,
    produto: (v.produto ?? "") as string, precoCusto: (v.preco_custo ?? 0) as number,
    precoVenda: (v.preco_venda ?? 0) as number, lucro: (v.lucro ?? 0) as number,
    isUsd: (v.is_usd ?? false) as boolean, precoUsd: v.preco_usd as number | undefined,
    cotacao: v.cotacao as number | undefined, margemUsada: (v.margem_usada ?? 20) as number,
    tipoPagamento: v.tipo_pagamento as TipoPagamento,
    valorEntrada: (v.valor_entrada ?? 0) as number, parcelas,
    observacoes: (v.observacoes ?? "") as string, data: v.data as string,
    status: v.status as StatusPagamento,
  };
}

interface AppContextType {
  state: AppState;
  addCliente: (c: Omit<Cliente, "id">) => Promise<void>;
  updateClienteAction: (c: Cliente) => Promise<void>;
  deleteClienteAction: (id: string) => Promise<void>;
  addVenda: (v: Omit<VendaPerfume, "id"> | Omit<VendaEletronico, "id">) => Promise<void>;
  updateVendaAction: (id: string, fields: UpdateVendaFields) => Promise<void>;
  deleteVendaAction: (id: string) => Promise<void>;
  marcarParcelaPaga: (vendaId: string, numeroParcela: number) => Promise<void>;
  desmarcarParcelaPaga: (vendaId: string, numeroParcela: number) => Promise<void>;
  registrarPagamento: (vendaId: string, numeroParcela: number, valorPago: number) => Promise<void>;
  desfazerPagamento: (vendaId: string, numeroParcela: number) => Promise<void>;
  marcarVendaPaga: (vendaId: string) => Promise<void>;
  addProdutoPerfume: (p: Omit<ProdutoPerfume, "id">) => Promise<void>;
  deleteProdutoPerfumeAction: (id: string) => Promise<void>;
  addProdutoEletronico: (p: Omit<ProdutoEletronico, "id">) => Promise<void>;
  deleteProdutoEletronicoAction: (id: string) => Promise<void>;
  setMargemAction: (m: number) => Promise<void>;
  addVendedorAction: (v: Omit<Vendedor, "id">) => Promise<void>;
  deleteVendedorAction: (id: string) => Promise<void>;
  addCompraAction: (c: Omit<Compra, "id">) => Promise<void>;
  deleteCompraAction: (id: string) => Promise<void>;
  ajustarEstoqueAction: (a: AjusteEstoque) => Promise<void>;
  reload: () => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>({
    margem: 20, clientes: [], vendas: [], vendedores: [],
    catalogoPerfumes: [], catalogoEletronicos: [],
    compras: [], movimentacoes: [], loading: true, session: null,
  });
  const dataLoaded = useRef(false);

  const loadData = useCallback(async () => {
    if (dataLoaded.current) return;
    dataLoaded.current = true;
    setState((s) => ({ ...s, loading: true }));
    try {
      const [margem, clientes, vendasRaw, catalogoPerfumes, catalogoEletronicos] =
        await Promise.all([fetchMargem(), fetchClientes(), fetchVendas(), fetchCatalogoPerfumes(), fetchCatalogoEletronicos()]);
      let vendedoresRaw: { id: string; nome: string; email: string; ativo: boolean }[] = [];
      try { vendedoresRaw = await fetchVendedores(); } catch { /* opcional */ }
      let comprasRaw: Awaited<ReturnType<typeof fetchCompras>> = [];
      try { comprasRaw = await fetchCompras(); } catch { /* tabela pode não existir ainda */ }
      let movsRaw: Awaited<ReturnType<typeof fetchMovimentacoes>> = [];
      try { movsRaw = await fetchMovimentacoes(); } catch { /* tabela pode não existir ainda */ }

      setState((s) => ({
        ...s, margem,
        clientes: clientes.map((c) => ({ id: c.id, nome: c.nome, telefone: c.telefone, email: c.email, notas: c.notas })),
        vendas: vendasRaw.map(dbToVenda),
        vendedores: vendedoresRaw.map((v) => ({ id: v.id, nome: v.nome, email: v.email, ativo: v.ativo })),
        catalogoPerfumes: catalogoPerfumes.map((p) => ({
          id: p.id, marca: p.marca, nome: p.nome, quantidade: p.quantidade,
          precoUsd: p.preco_usd, precoBrl: p.preco_brl,
          estoqueAtual: (p as any).estoque_atual ?? p.quantidade ?? 0,
          precoCustoMedio: (p as any).preco_custo_medio ?? p.preco_brl ?? 0,
        })),
        catalogoEletronicos: catalogoEletronicos.map((p) => ({
          id: p.id, nome: p.nome, precoReferencia: p.preco_referencia,
          estoqueAtual: (p as any).estoque_atual ?? 0,
          precoCustoMedio: (p as any).preco_custo_medio ?? 0,
        })),
        compras: comprasRaw.map((c) => ({
          id: c.id, tipo: c.tipo, produto_id: c.produto_id,
          produto_nome: c.produto_nome, marca: c.marca ?? "",
          quantidade: c.quantidade, preco_usd: c.preco_usd ?? 0,
          cotacao: c.cotacao ?? 0, preco_brl: c.preco_brl, preco_unit: c.preco_unit,
          fornecedor: c.fornecedor ?? "", origem: c.origem ?? "", data: c.data, observacoes: c.observacoes ?? "",
        })),
        movimentacoes: movsRaw.map((m) => ({
          id: m.id, tipo: m.tipo, produto_id: m.produto_id,
          produto_nome: m.produto_nome, marca: m.marca ?? "",
          operacao: m.operacao, origem: m.origem, ref_id: m.ref_id,
          quantidade: m.quantidade, quantidade_anterior: m.quantidade_anterior ?? 0,
          quantidade_nova: m.quantidade_nova ?? 0, preco_unit: m.preco_unit ?? 0,
          data: m.data, observacoes: m.observacoes ?? "",
        })),
        loading: false,
      }));
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
      dataLoaded.current = false;
      setState((s) => ({ ...s, loading: false }));
    }
  }, []);

  const reload = useCallback(async () => {
    dataLoaded.current = false;
    await loadData();
  }, [loadData]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setState((s) => ({ ...s, session }));
      if (session && !dataLoaded.current) loadData();
      if (!session) {
        dataLoaded.current = false;
        setState((s) => ({
          ...s, session: null, loading: false, clientes: [], vendas: [],
          vendedores: [], catalogoPerfumes: [], catalogoEletronicos: [],
          compras: [], movimentacoes: [],
        }));
      }
    });
    return () => subscription.unsubscribe();
  }, [loadData]);

  async function addCliente(c: Omit<Cliente, "id">) {
    const novo = await insertCliente(c);
    setState((s) => ({ ...s, clientes: [{ ...novo }, ...s.clientes] }));
  }
  async function updateClienteAction(c: Cliente) {
    await updateCliente(c);
    setState((s) => ({ ...s, clientes: s.clientes.map((x) => x.id === c.id ? c : x) }));
  }
  async function deleteClienteAction(id: string) {
    await deleteCliente(id);
    setState((s) => ({ ...s, clientes: s.clientes.filter((c) => c.id !== id) }));
  }

  async function addVenda(venda: Omit<VendaPerfume, "id"> | Omit<VendaEletronico, "id">) {
    const base = {
      cliente: venda.cliente, telefone: venda.telefone ?? "", vendedor: venda.vendedor ?? "",
      tipo_pagamento: venda.tipoPagamento, observacoes: venda.observacoes, data: venda.data,
      status: venda.status, margem_usada: venda.margemUsada,
      valor_entrada: (venda as VendaPerfume).valorEntrada ?? 0,
    };
    const dbVenda = venda.tipo === "perfume"
      ? { ...base, tipo: "perfume" as const, perfume: (venda as VendaPerfume).perfume, preco_usd: (venda as VendaPerfume).precoUsd, cotacao: (venda as VendaPerfume).cotacao, preco_brl: (venda as VendaPerfume).precoBrl, valor_final: (venda as VendaPerfume).valorFinal }
      : { ...base, tipo: "eletronico" as const, produto: (venda as VendaEletronico).produto, preco_custo: (venda as VendaEletronico).precoCusto, preco_venda: (venda as VendaEletronico).precoVenda, lucro: (venda as VendaEletronico).lucro, is_usd: (venda as VendaEletronico).isUsd, preco_usd: (venda as VendaEletronico).precoUsd, cotacao: (venda as VendaEletronico).cotacao };
    const dbParcelas = venda.parcelas.map((p) => ({ numero: p.numero, total: p.total, vencimento: p.vencimento, status: p.status }));
    const nova = await insertVenda(dbVenda as Parameters<typeof insertVenda>[0], dbParcelas);
    // Saída de estoque automática
    try {
      const segs = venda.tipo === "perfume"
        ? (venda as VendaPerfume).perfume.split(",")
        : [(venda as VendaEletronico).produto.split(",")[0]];
      for (const seg of segs) {
        const t = seg.trim(); const pi = t.indexOf("|");
        const nome = pi !== -1 ? t.slice(pi + 1).trim() : t;
        await insertMovimentacao({
          tipo: venda.tipo, produto_nome: nome, marca: "", operacao: "saida", origem: "venda",
          ref_id: nova.id, quantidade: -1, quantidade_anterior: 0, quantidade_nova: 0,
          preco_unit: 0, data: venda.data, observacoes: `Venda para ${venda.cliente}`,
        });
      }
    } catch { /* silencia */ }
    const novaVenda = dbToVenda({ ...nova, parcelas: dbParcelas.map((p, i) => ({ ...p, id: `tmp-${i}`, venda_id: nova.id, valor_pago: 0 })) } as DbRow);
    setState((s) => ({ ...s, vendas: [novaVenda, ...s.vendas] }));
  }

  async function updateVendaAction(id: string, fields: UpdateVendaFields) {
    const d: Record<string, unknown> = {};
    if ("cliente"       in fields) d.cliente        = fields.cliente;
    if ("telefone"      in fields) d.telefone       = fields.telefone;
    if ("vendedor"      in fields) d.vendedor       = fields.vendedor;
    if ("observacoes"   in fields) d.observacoes    = fields.observacoes;
    if ("data"          in fields) d.data           = fields.data;
    if ("status"        in fields) d.status         = fields.status;
    if ("margemUsada"   in fields) d.margem_usada   = fields.margemUsada;
    if ("tipoPagamento" in fields) d.tipo_pagamento = fields.tipoPagamento;
    if ("valorEntrada"  in fields) d.valor_entrada  = (fields as UpdateVendaPerfumeFields).valorEntrada;
    if ("perfume"       in fields) d.perfume        = (fields as UpdateVendaPerfumeFields).perfume;
    if ("precoUsd"      in fields) d.preco_usd      = (fields as UpdateVendaPerfumeFields).precoUsd;
    if ("cotacao"       in fields) d.cotacao        = (fields as UpdateVendaPerfumeFields).cotacao;
    if ("precoBrl"      in fields) d.preco_brl      = (fields as UpdateVendaPerfumeFields).precoBrl;
    if ("valorFinal"    in fields) d.valor_final    = (fields as UpdateVendaPerfumeFields).valorFinal;
    if ("produto"       in fields) d.produto        = (fields as UpdateVendaEletronicoFields).produto;
    if ("precoCusto"    in fields) d.preco_custo    = (fields as UpdateVendaEletronicoFields).precoCusto;
    if ("precoVenda"    in fields) d.preco_venda    = (fields as UpdateVendaEletronicoFields).precoVenda;
    if ("lucro"         in fields) d.lucro          = (fields as UpdateVendaEletronicoFields).lucro;
    if ("isUsd"         in fields) d.is_usd         = (fields as UpdateVendaEletronicoFields).isUsd;
    await updateVenda(id, d as Parameters<typeof updateVenda>[1]);
    if ("parcelas" in fields && fields.parcelas !== undefined) {
      await recriarParcelas(id, (fields.parcelas as Parcela[]).map((p) => ({
        numero: p.numero, total: p.total, vencimento: p.vencimento, status: p.status,
      })));
    }
    setState((s) => ({
      ...s,
      vendas: s.vendas.map((v) => {
        if (v.id !== id) return v;
        const parcelasAtualizadas = ("parcelas" in fields && fields.parcelas !== undefined)
          ? (fields.parcelas as Parcela[]) : v.parcelas;
        return { ...v, ...fields, parcelas: parcelasAtualizadas };
      }),
    }));
  }

  async function deleteVendaAction(id: string) {
    await deleteVenda(id);
    setState((s) => ({ ...s, vendas: s.vendas.filter((v) => v.id !== id) }));
  }

  async function registrarPagamento(vendaId: string, numeroParcela: number, valorPago: number) {
    await registrarPagamentoParcela(vendaId, numeroParcela, valorPago);
    setState((s) => ({
      ...s,
      vendas: s.vendas.map((v) => {
        if (v.id !== vendaId) return v;
        const novas = v.parcelas.map((p) => p.numero === numeroParcela ? { ...p, status: "pago" as StatusPagamento, valorPago } : p);
        return { ...v, parcelas: novas, status: novas.every((p) => p.status === "pago") ? "pago" as StatusPagamento : "pendente" as StatusPagamento };
      }),
    }));
  }
  async function desfazerPagamento(vendaId: string, numeroParcela: number) {
    await desfazerPagamentoParcela(vendaId, numeroParcela);
    setState((s) => ({
      ...s,
      vendas: s.vendas.map((v) => {
        if (v.id !== vendaId) return v;
        return { ...v, parcelas: v.parcelas.map((p) => p.numero === numeroParcela ? { ...p, status: "pendente" as StatusPagamento, valorPago: 0 } : p), status: "pendente" as StatusPagamento };
      }),
    }));
  }
  async function desmarcarParcelaPaga(vendaId: string, numeroParcela: number) {
    await updateParcelaStatus(vendaId, numeroParcela, "pendente");
    setState((s) => ({
      ...s,
      vendas: s.vendas.map((v) => {
        if (v.id !== vendaId) return v;
        return { ...v, parcelas: v.parcelas.map((p) => p.numero === numeroParcela ? { ...p, status: "pendente" as StatusPagamento } : p), status: "pendente" as StatusPagamento };
      }),
    }));
  }
  async function marcarParcelaPaga(vendaId: string, numeroParcela: number) {
    await updateParcelaStatus(vendaId, numeroParcela, "pago");
    setState((s) => ({
      ...s,
      vendas: s.vendas.map((v) => {
        if (v.id !== vendaId) return v;
        const novas = v.parcelas.map((p) => p.numero === numeroParcela ? { ...p, status: "pago" as StatusPagamento } : p);
        return { ...v, parcelas: novas, status: novas.every((p) => p.status === "pago") ? "pago" as StatusPagamento : "pendente" as StatusPagamento };
      }),
    }));
  }
  async function marcarVendaPaga(vendaId: string) {
    await updateVendaStatus(vendaId, "pago");
    setState((s) => ({
      ...s,
      vendas: s.vendas.map((v) => v.id === vendaId
        ? { ...v, status: "pago" as StatusPagamento, parcelas: v.parcelas.map((p) => ({ ...p, status: "pago" as StatusPagamento })) } : v),
    }));
  }

  async function addProdutoPerfume(p: Omit<ProdutoPerfume, "id">) {
    const novo = await insertProdutoPerfume({ marca: p.marca, nome: p.nome, quantidade: p.quantidade, preco_usd: p.precoUsd, preco_brl: p.precoBrl });
    setState((s) => ({ ...s, catalogoPerfumes: [...s.catalogoPerfumes, { id: novo.id, marca: novo.marca, nome: novo.nome, quantidade: novo.quantidade, precoUsd: novo.preco_usd, precoBrl: novo.preco_brl, estoqueAtual: novo.quantidade ?? 0 }] }));
  }
  async function deleteProdutoPerfumeAction(id: string) {
    await deleteProdutoPerfume(id);
    setState((s) => ({ ...s, catalogoPerfumes: s.catalogoPerfumes.filter((p) => p.id !== id) }));
  }
  async function addProdutoEletronico(p: Omit<ProdutoEletronico, "id">) {
    const novo = await insertProdutoEletronico({ nome: p.nome, preco_referencia: p.precoReferencia });
    setState((s) => ({ ...s, catalogoEletronicos: [...s.catalogoEletronicos, { id: novo.id, nome: novo.nome, precoReferencia: novo.preco_referencia, estoqueAtual: 0 }] }));
  }
  async function deleteProdutoEletronicoAction(id: string) {
    await deleteProdutoEletronico(id);
    setState((s) => ({ ...s, catalogoEletronicos: s.catalogoEletronicos.filter((p) => p.id !== id) }));
  }
  async function setMargemAction(m: number) {
    await saveMargem(m);
    setState((s) => ({ ...s, margem: m }));
  }
  async function addVendedorAction(v: Omit<Vendedor, "id">) {
    const novo = await insertVendedor({ nome: v.nome, email: v.email, ativo: v.ativo });
    setState((s) => ({ ...s, vendedores: [...s.vendedores, { id: novo.id, nome: novo.nome, email: novo.email, ativo: novo.ativo }] }));
  }
  async function deleteVendedorAction(id: string) {
    await deleteVendedor(id);
    setState((s) => ({ ...s, vendedores: s.vendedores.filter((v) => v.id !== id) }));
  }

  async function addCompraAction(c: Omit<Compra, "id">) {
    const nova = await insertCompra({
      tipo: c.tipo, produto_nome: c.produto_nome, marca: c.marca,
      quantidade: c.quantidade, preco_usd: c.preco_usd, cotacao: c.cotacao,
      preco_brl: c.preco_brl, preco_unit: c.preco_unit,
      fornecedor: c.fornecedor, origem: c.origem, data: c.data, observacoes: c.observacoes,
    });
    if (c.produto_id) {
      const estoqueAnt = c.tipo === "perfume"
        ? (state.catalogoPerfumes.find((p) => p.id === c.produto_id)?.estoqueAtual ?? 0)
        : (state.catalogoEletronicos.find((p) => p.id === c.produto_id)?.estoqueAtual ?? 0);
      const custoAnt = c.tipo === "perfume"
        ? (state.catalogoPerfumes.find((p) => p.id === c.produto_id)?.precoCustoMedio ?? 0)
        : (state.catalogoEletronicos.find((p) => p.id === c.produto_id)?.precoCustoMedio ?? 0);
      const estoqueNovo = estoqueAnt + c.quantidade;
      const novoCusto = estoqueAnt > 0
        ? (estoqueAnt * custoAnt + c.quantidade * c.preco_unit) / estoqueNovo
        : c.preco_unit;
      if (c.tipo === "perfume") {
        await updateEstoquePerfume(c.produto_id, estoqueNovo, novoCusto);
        setState((s) => ({ ...s, catalogoPerfumes: s.catalogoPerfumes.map((p) => p.id === c.produto_id ? { ...p, estoqueAtual: estoqueNovo, quantidade: estoqueNovo, precoCustoMedio: novoCusto } : p) }));
      } else {
        await updateEstoqueEletronico(c.produto_id, estoqueNovo, novoCusto);
        setState((s) => ({ ...s, catalogoEletronicos: s.catalogoEletronicos.map((p) => p.id === c.produto_id ? { ...p, estoqueAtual: estoqueNovo, precoCustoMedio: novoCusto } : p) }));
      }
    }
    try {
      await insertMovimentacao({
        tipo: c.tipo, produto_nome: c.produto_nome, marca: c.marca,
        operacao: "entrada", origem: "compra", ref_id: nova.id,
        quantidade: c.quantidade, quantidade_anterior: 0, quantidade_nova: c.quantidade,
        preco_unit: c.preco_unit, data: c.data,
        observacoes: `Compra de ${c.fornecedor || c.produto_nome}`,
      });
    } catch { /* silencia */ }
    setState((s) => ({
      ...s,
      compras: [{ id: nova.id, tipo: nova.tipo, produto_nome: nova.produto_nome, marca: nova.marca ?? "", quantidade: nova.quantidade, preco_usd: nova.preco_usd ?? 0, cotacao: nova.cotacao ?? 0, preco_brl: nova.preco_brl, preco_unit: nova.preco_unit, fornecedor: nova.fornecedor ?? "", origem: nova.origem ?? "", data: nova.data, observacoes: nova.observacoes ?? "" }, ...s.compras],
    }));
  }

  async function deleteCompraAction(id: string) {
    await deleteCompra(id);
    setState((s) => ({ ...s, compras: s.compras.filter((c) => c.id !== id) }));
  }

  async function ajustarEstoqueAction(a: AjusteEstoque) {
    const diff = a.quantidade_nova - a.quantidade_anterior;
    if (a.tipo === "perfume") {
      await updateEstoquePerfume(a.produto_id, a.quantidade_nova);
      setState((s) => ({ ...s, catalogoPerfumes: s.catalogoPerfumes.map((p) => p.id === a.produto_id ? { ...p, estoqueAtual: a.quantidade_nova, quantidade: a.quantidade_nova } : p) }));
    } else {
      await updateEstoqueEletronico(a.produto_id, a.quantidade_nova);
      setState((s) => ({ ...s, catalogoEletronicos: s.catalogoEletronicos.map((p) => p.id === a.produto_id ? { ...p, estoqueAtual: a.quantidade_nova } : p) }));
    }
    try {
      const mov = await insertMovimentacao({
        tipo: a.tipo, produto_nome: a.produto_nome, marca: "",
        operacao: "ajuste", origem: "ajuste_manual", quantidade: diff,
        quantidade_anterior: a.quantidade_anterior, quantidade_nova: a.quantidade_nova,
        preco_unit: 0, data: a.data, observacoes: a.observacoes || "Ajuste manual",
      });
      setState((s) => ({
        ...s,
        movimentacoes: [{ id: mov.id, tipo: mov.tipo, produto_nome: mov.produto_nome, marca: "", operacao: mov.operacao, origem: mov.origem, quantidade: mov.quantidade, quantidade_anterior: mov.quantidade_anterior ?? 0, quantidade_nova: mov.quantidade_nova ?? 0, preco_unit: 0, data: mov.data, observacoes: mov.observacoes ?? "" }, ...s.movimentacoes],
      }));
    } catch { /* silencia */ }
  }

  return (
    <AppContext.Provider value={{
      state, addCliente, updateClienteAction, deleteClienteAction,
      addVenda, updateVendaAction, deleteVendaAction,
      marcarParcelaPaga, desmarcarParcelaPaga, marcarVendaPaga,
      registrarPagamento, desfazerPagamento,
      addProdutoPerfume, deleteProdutoPerfumeAction,
      addProdutoEletronico, deleteProdutoEletronicoAction,
      setMargemAction, addVendedorAction, deleteVendedorAction,
      addCompraAction, deleteCompraAction, ajustarEstoqueAction, reload,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp deve ser usado dentro do AppProvider");
  return ctx;
}

export function useCobrancas() {
  const { state } = useApp();
  return state.vendas.flatMap((venda) => {
    if (venda.tipoPagamento !== "parcelado") return [];
    const valorTotal = venda.tipo === "perfume" ? venda.valorFinal : venda.precoVenda;
    const valorEntrada = venda.valorEntrada ?? 0;
    const parcelasNormais = venda.parcelas.filter((p) => p.numero > 0);
    const valorParcNormal = parcelasNormais.length > 0 ? (valorTotal - valorEntrada) / parcelasNormais.length : 0;
    return venda.parcelas.filter((p) => p.status !== "pago").map((p) => ({
      vendaId: venda.id, cliente: venda.cliente, telefone: venda.telefone, vendedor: venda.vendedor,
      produto: venda.tipo === "perfume" ? venda.perfume : venda.produto,
      parcela: `${p.numero}/${p.total}`,
      valor: p.valorPago && p.valorPago > 0 ? p.valorPago : p.numero === 0 ? valorEntrada : valorParcNormal,
      vencimento: p.vencimento, status: p.status,
    }));
  });
}