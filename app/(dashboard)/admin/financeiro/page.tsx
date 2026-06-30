"use client";

import { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import DateInput from "@/components/ui/DateInput";

interface ItemCasa { id: string; nome: string; unidadePadrao: string | null }
interface Moradora { id: string; nome: string; ativo: boolean }
interface Despesa {
  id: string; descricao: string; valor: number; categoria: string;
  dataDespesa: string; quantidade: number | null; unidade: string | null;
  pagador: { id: string; nome: string };
  itemCasa: ItemCasa | null;
}

type TipoLancamento = "ALUGUEL" | "GAS" | "ITEM";

const TIPO_LABEL: Record<TipoLancamento, string> = {
  ALUGUEL: "Aluguel",
  GAS: "Gás",
  ITEM: "Compra de item",
};

function mesAtual() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function fmt(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function FinanceiroAdminPage() {
  const [mes, setMes] = useState(mesAtual());
  const [despesas, setDespesas] = useState<Despesa[]>([]);
  const [itens, setItens] = useState<ItemCasa[]>([]);
  const [moradoras, setMoradoras] = useState<Moradora[]>([]);
  const [carregando, setCarregando] = useState(true);

  // Modal lançamento
  const [modalLanc, setModalLanc] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [tipo, setTipo] = useState<TipoLancamento>("ITEM");
  const [form, setForm] = useState({
    descricao: "", valor: "", dataDespesa: "",
    pagadorId: "", itemCasaId: "", quantidade: "", unidade: "",
  });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  // Modal catálogo
  const [modalCatalogo, setModalCatalogo] = useState(false);
  const [novoItem, setNovoItem] = useState({ nome: "", unidadePadrao: "" });
  const [salvandoItem, setSalvandoItem] = useState(false);
  const [itensTodos, setItensTodos] = useState<(ItemCasa & { ativo: boolean })[]>([]);

  async function carregar() {
    setCarregando(true);
    const [dRes, iRes, mRes] = await Promise.all([
      fetch(`/api/financeiro/despesas?mes=${mes}`),
      fetch("/api/items-casa"),
      fetch("/api/moradoras"),
    ]);
    setDespesas(await dRes.json());
    setItens(await iRes.json());
    const m = await mRes.json();
    setMoradoras(m);
    setCarregando(false);
  }

  async function carregarCatalogo() {
    const res = await fetch("/api/items-casa");
    const data = await res.json();
    setItensTodos(data);
  }

  useEffect(() => { carregar(); }, [mes]);

  function abrirLancamento() {
    setEditandoId(null);
    setTipo("ITEM");
    setForm({ descricao: "", valor: "", dataDespesa: "", pagadorId: "", itemCasaId: "", quantidade: "", unidade: "" });
    setErro("");
    setModalLanc(true);
  }

  function abrirEdicao(d: Despesa) {
    setEditandoId(d.id);
    setTipo(d.categoria === "ALUGUEL" ? "ALUGUEL" : d.categoria === "GAS" ? "GAS" : "ITEM");
    setForm({
      descricao: d.descricao,
      valor: String(Number(d.valor)),
      dataDespesa: d.dataDespesa.split("T")[0],
      pagadorId: d.pagador.id,
      itemCasaId: d.itemCasa?.id ?? "",
      quantidade: d.quantidade != null ? String(Number(d.quantidade)) : "",
      unidade: d.unidade ?? "",
    });
    setErro("");
    setModalLanc(true);
  }

  // Auto-preenche unidade ao selecionar item
  function selecionarItem(itemId: string) {
    const item = itens.find(i => i.id === itemId);
    setForm(f => ({
      ...f,
      itemCasaId: itemId,
      unidade: item?.unidadePadrao ?? f.unidade,
      descricao: item ? item.nome : f.descricao,
    }));
  }

  async function salvarLancamento() {
    setSalvando(true);
    setErro("");

    const categoria = tipo === "ALUGUEL" ? "ALUGUEL" : tipo === "GAS" ? "GAS" : "OUTRO";

    const body: Record<string, unknown> = {
      descricao: form.descricao || (tipo === "GAS" ? "Botijão de gás" : ""),
      valor: parseFloat(form.valor),
      categoria,
      dataDespesa: form.dataDespesa,
      pagadorId: form.pagadorId || undefined,
    };
    if (tipo === "ITEM") {
      if (!form.itemCasaId) { setErro("Selecione um item"); setSalvando(false); return; }
      body.itemCasaId = form.itemCasaId;
      body.quantidade = form.quantidade ? parseFloat(form.quantidade) : null;
      body.unidade = form.unidade || null;
    } else {
      body.itemCasaId = null;
      body.quantidade = null;
      body.unidade = null;
    }

    const url = editandoId ? `/api/financeiro/despesas/${editandoId}` : "/api/financeiro/despesas";
    const res = await fetch(url, {
      method: editandoId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSalvando(false);
    if (!res.ok) { setErro((await res.json()).error ?? "Erro ao salvar"); return; }
    setModalLanc(false);
    setEditandoId(null);
    carregar();
  }

  async function excluir(id: string) {
    if (!confirm("Excluir este lançamento?")) return;
    await fetch(`/api/financeiro/despesas/${id}`, { method: "DELETE" });
    carregar();
  }

  async function adicionarItem() {
    if (!novoItem.nome) return;
    setSalvandoItem(true);
    await fetch("/api/items-casa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(novoItem),
    });
    setSalvandoItem(false);
    setNovoItem({ nome: "", unidadePadrao: "" });
    carregarCatalogo();
    carregar();
  }

  async function toggleItem(id: string, ativo: boolean) {
    await fetch(`/api/items-casa/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ativo }),
    });
    carregarCatalogo();
    carregar();
  }

  const ativas = moradoras.filter(m => m.ativo);
  const alugueis = despesas.filter(d => d.categoria === "ALUGUEL");
  const gas = despesas.filter(d => d.categoria === "GAS");
  const compras = despesas.filter(d => d.categoria !== "ALUGUEL" && d.categoria !== "GAS");
  const totalMes = despesas.reduce((acc, d) => acc + Number(d.valor), 0);

  // Agrupa compras por item
  const porItem: Record<string, { item: ItemCasa | null; registros: Despesa[] }> = {};
  compras.forEach(d => {
    const key = d.itemCasa?.id ?? "sem-item";
    if (!porItem[key]) porItem[key] = { item: d.itemCasa, registros: [] };
    porItem[key].registros.push(d);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Financeiro</h1>
        <div className="flex flex-wrap gap-2 items-center">
          <input type="month" lang="pt-BR" value={mes} onChange={e => setMes(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-xl text-sm" />
          <Button variant="secondary" onClick={() => { carregarCatalogo(); setModalCatalogo(true); }}>
            Catálogo de itens
          </Button>
          <Button onClick={abrirLancamento}>+ Lançamento</Button>
        </div>
      </div>

      {carregando ? <p className="text-gray-500">Carregando…</p> : (
        <>
          {/* Resumo */}
          <Card className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total em {mes}</p>
              <p className="text-2xl font-bold text-gray-900">{fmt(totalMes)}</p>
            </div>
            <div className="text-right text-xs text-gray-400 space-y-0.5">
              <p>{alugueis.length} aluguel(is)</p>
              <p>{gas.length} gás</p>
              <p>{compras.length} compra(s)</p>
            </div>
          </Card>

          {/* Aluguéis */}
          {alugueis.length > 0 && (
            <Section titulo="Aluguéis">
              {alugueis.map(d => (
                <DespesaCard key={d.id} d={d} onExcluir={excluir} onEditar={abrirEdicao} />
              ))}
            </Section>
          )}

          {/* Gás */}
          {gas.length > 0 && (
            <Section titulo="Gás">
              {gas.map(d => {
                const parcelaGas = ativas.length > 0 ? Number(d.valor) / ativas.length : 0;
                return (
                  <Card key={d.id}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-gray-900">{d.descricao}</p>
                        <p className="text-xs text-gray-400">
                          {d.pagador.nome} · {new Date(d.dataDespesa).toLocaleDateString("pt-BR")}
                        </p>
                        <div className="mt-2 bg-amber-50 rounded-xl px-3 py-2">
                          <p className="text-xs font-medium text-amber-800">
                            Divisão entre {ativas.length} moradoras:
                            cada uma deve {fmt(parcelaGas)} à {d.pagador.nome}
                          </p>
                          <div className="mt-1 space-y-0.5">
                            {ativas.filter(m => m.id !== d.pagador.id).map(m => (
                              <p key={m.id} className="text-xs text-amber-700">• {m.nome}: {fmt(parcelaGas)}</p>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <span className="font-semibold text-gray-800">{fmt(Number(d.valor))}</span>
                        <Button variant="ghost" size="sm" onClick={() => abrirEdicao(d)}>✎</Button>
                        <Button variant="ghost" size="sm" onClick={() => excluir(d.id)}>✕</Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </Section>
          )}

          {/* Compras da casa por item */}
          {compras.length > 0 && (
            <Section titulo="Compras da casa">
              {Object.values(porItem).map(({ item, registros }) => (
                <div key={item?.id ?? "sem"}>
                  <p className="text-xs font-semibold text-gray-500 mb-1 ml-1">
                    {item?.nome ?? "Sem item"}
                  </p>
                  {registros.map(d => (
                    <DespesaCard key={d.id} d={d} onExcluir={excluir} onEditar={abrirEdicao} showQtd />
                  ))}
                </div>
              ))}
            </Section>
          )}

          {despesas.length === 0 && (
            <Card><p className="text-gray-500 text-center py-4">Nenhum lançamento neste mês.</p></Card>
          )}
        </>
      )}

      {/* Modal: novo lançamento */}
      <Modal aberto={modalLanc} onFechar={() => { setModalLanc(false); setEditandoId(null); }} titulo={editandoId ? "Editar lançamento" : "Novo lançamento"}>
        <div className="space-y-4">
          {/* Tipo */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Tipo</label>
            <div className="flex gap-2">
              {(["ITEM", "GAS", "ALUGUEL"] as TipoLancamento[]).map(t => (
                <button key={t} onClick={() => setTipo(t)}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-colors ${
                    tipo === t
                      ? "bg-primary-50 border-primary-400 text-primary-700"
                      : "border-gray-200 text-gray-500 hover:border-gray-300"
                  }`}>
                  {TIPO_LABEL[t]}
                </button>
              ))}
            </div>
          </div>

          {/* Item da casa */}
          {tipo === "ITEM" && (
            <>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Item</label>
                <select value={form.itemCasaId} onChange={e => selecionarItem(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-400 text-base">
                  <option value="">— selecione —</option>
                  {itens.map(i => <option key={i.id} value={i.id}>{i.nome}</option>)}
                </select>
              </div>
              <div className="flex gap-3">
                <div className="w-28">
                  <Input label="Quantidade" type="number" step="0.5" min="0.5"
                    value={form.quantidade} onChange={e => setForm({ ...form, quantidade: e.target.value })} />
                </div>
                <div className="flex-1">
                  <Input label="Unidade" placeholder="ex: frascos, pacotes"
                    value={form.unidade} onChange={e => setForm({ ...form, unidade: e.target.value })} />
                </div>
              </div>
            </>
          )}

          {/* Descrição */}
          <Input
            label={tipo === "GAS" ? "Descrição (opcional)" : tipo === "ALUGUEL" ? "Descrição" : "Observação (opcional)"}
            value={form.descricao}
            onChange={e => setForm({ ...form, descricao: e.target.value })}
            placeholder={tipo === "GAS" ? "Botijão 13kg" : tipo === "ALUGUEL" ? "Ex: Aluguel junho — quarto 3" : ""}
          />
          <div className="flex gap-3">
            <div className="flex-1">
              <Input label="Valor (R$)" type="number" step="0.01" min="0.01"
                value={form.valor} onChange={e => setForm({ ...form, valor: e.target.value })} />
            </div>
            <div className="flex-1">
              <DateInput label="Data"
                value={form.dataDespesa} onChange={e => setForm({ ...form, dataDespesa: e.target.value })} />
            </div>
          </div>

          {/* Pago por */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Registrado por / pago por</label>
            <select value={form.pagadorId} onChange={e => setForm({ ...form, pagadorId: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-400 text-base">
              <option value="">— selecione —</option>
              {ativas.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
            </select>
          </div>

          {tipo === "GAS" && form.valor && ativas.length > 0 && (
            <div className="bg-amber-50 rounded-xl px-4 py-3 text-sm text-amber-800">
              Cada moradora pagará{" "}
              <strong>{fmt(parseFloat(form.valor) / ativas.length)}</strong>{" "}
              ({ativas.length} moradoras ativas)
            </div>
          )}

          {erro && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-2">{erro}</p>}
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => { setModalLanc(false); setEditandoId(null); }}>Cancelar</Button>
            <Button className="flex-1" onClick={salvarLancamento} disabled={salvando}>
              {salvando ? "Salvando…" : editandoId ? "Salvar alterações" : "Salvar"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: catálogo */}
      <Modal aberto={modalCatalogo} onFechar={() => setModalCatalogo(false)} titulo="Catálogo de itens da casa">
        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Input placeholder="Nome do item (ex: Detergente)"
                value={novoItem.nome} onChange={e => setNovoItem({ ...novoItem, nome: e.target.value })} />
            </div>
            <div className="w-32">
              <Input placeholder="Unidade (ex: frasco)"
                value={novoItem.unidadePadrao} onChange={e => setNovoItem({ ...novoItem, unidadePadrao: e.target.value })} />
            </div>
            <Button onClick={adicionarItem} disabled={salvandoItem || !novoItem.nome}>
              +
            </Button>
          </div>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {itensTodos.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">Nenhum item cadastrado.</p>
            ) : (
              itensTodos.map(i => (
                <div key={i.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{i.nome}</p>
                    {i.unidadePadrao && <p className="text-xs text-gray-400">{i.unidadePadrao}</p>}
                  </div>
                  <Button variant="ghost" size="sm"
                    onClick={() => toggleItem(i.id, !i.ativo)}>
                    {i.ativo ? "Arquivar" : "Reativar"}
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}

function Section({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-sm font-semibold text-gray-600 mb-2">{titulo}</p>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function DespesaCard({
  d, onExcluir, onEditar, showQtd,
}: {
  d: Despesa; onExcluir: (id: string) => void; onEditar?: (d: Despesa) => void; showQtd?: boolean;
}) {
  return (
    <Card className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="font-medium text-gray-900 text-sm truncate">{d.descricao}</p>
        <p className="text-xs text-gray-400">
          {d.pagador.nome} · {new Date(d.dataDespesa).toLocaleDateString("pt-BR")}
          {showQtd && d.quantidade && (
            <> · {Number(d.quantidade)}{d.unidade ? ` ${d.unidade}` : ""}</>
          )}
        </p>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <span className="font-semibold text-gray-800 text-sm">
          {Number(d.valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
        </span>
        {onEditar && <Button variant="ghost" size="sm" onClick={() => onEditar(d)}>✎</Button>}
        <Button variant="ghost" size="sm" onClick={() => onExcluir(d.id)}>✕</Button>
      </div>
    </Card>
  );
}
