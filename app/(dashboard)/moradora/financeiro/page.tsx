"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import DateInput from "@/components/ui/DateInput";

interface ItemCasa { id: string; nome: string; unidadePadrao: string | null }
interface Despesa {
  id: string; descricao: string; valor: number; categoria: string;
  dataDespesa: string; quantidade: number | null; unidade: string | null;
  pagador: { id: string; nome: string };
  itemCasa: ItemCasa | null;
}

function fmt(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function mesAtual() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

const formVazio = { itemCasaId: "", descricao: "", quantidade: "", unidade: "", valor: "", dataDespesa: "" };

export default function FinanceiroMoradoraPage() {
  const { data: session } = useSession();
  const [mes, setMes] = useState(mesAtual());
  const [despesas, setDespesas] = useState<Despesa[]>([]);
  const [itens, setItens] = useState<ItemCasa[]>([]);
  const [totalMoradoras, setTotalMoradoras] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [form, setForm] = useState(formVazio);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

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
    setTotalMoradoras(m.filter((x: { ativo: boolean }) => x.ativo).length);
    setCarregando(false);
  }

  useEffect(() => { carregar(); }, [mes]);

  function selecionarItem(itemId: string) {
    const item = itens.find(i => i.id === itemId);
    setForm(f => ({
      ...f,
      itemCasaId: itemId,
      unidade: item?.unidadePadrao ?? f.unidade,
      descricao: item ? item.nome : f.descricao,
    }));
  }

  async function salvar() {
    setSalvando(true);
    setErro("");
    if (!form.itemCasaId) { setErro("Selecione um item"); setSalvando(false); return; }

    const res = await fetch("/api/financeiro/despesas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        descricao: form.descricao || itens.find(i => i.id === form.itemCasaId)?.nome,
        valor: parseFloat(form.valor),
        categoria: "OUTRO",
        dataDespesa: form.dataDespesa,
        itemCasaId: form.itemCasaId,
        quantidade: form.quantidade ? parseFloat(form.quantidade) : null,
        unidade: form.unidade || null,
      }),
    });
    setSalvando(false);
    if (!res.ok) { setErro((await res.json()).error ?? "Erro ao salvar"); return; }
    setModalAberto(false);
    setForm(formVazio);
    carregar();
  }

  async function excluir(id: string) {
    if (!confirm("Excluir este lançamento?")) return;
    await fetch(`/api/financeiro/despesas/${id}`, { method: "DELETE" });
    carregar();
  }

  const gasDoMes = despesas.filter(d => d.categoria === "GAS");
  const compras = despesas.filter(d => d.categoria !== "ALUGUEL" && d.categoria !== "GAS");
  const minhas = compras.filter(d => d.pagador.id === session?.user.id);
  const colegas = compras.filter(d => d.pagador.id !== session?.user.id);

  const totalMinhas = minhas.reduce((acc, d) => acc + Number(d.valor), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Compras da casa</h1>
        <div className="flex gap-2 items-center">
          <input type="month" lang="pt-BR" value={mes} onChange={e => setMes(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-xl text-sm" />
          <Button onClick={() => { setForm(formVazio); setErro(""); setModalAberto(true); }}>
            + Registrar compra
          </Button>
        </div>
      </div>

      <p className="text-sm text-gray-500">
        Registre compras compartilhadas da casa: detergente, vassoura, saco de lixo, etc.
      </p>

      {carregando ? <p className="text-gray-500">Carregando…</p> : (
        <>
          {/* Resumo minhas compras */}
          {totalMinhas > 0 && (
            <Card className="bg-primary-50 border-primary-100">
              <p className="text-sm text-primary-700 font-medium">Minhas compras em {mes}</p>
              <p className="text-2xl font-bold text-primary-900 mt-0.5">{fmt(totalMinhas)}</p>
            </Card>
          )}

          {/* Gás do mês */}
          {gasDoMes.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-gray-600 mb-2">Gás</p>
              <div className="space-y-2">
                {gasDoMes.map(d => {
                  const parcela = totalMoradoras > 0 ? Number(d.valor) / totalMoradoras : 0;
                  const euComprei = d.pagador.id === session?.user.id;
                  return (
                    <Card key={d.id} className="border-amber-200 bg-amber-50">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-amber-900">{d.descricao}</p>
                          <p className="text-xs text-amber-700">
                            Comprado por {d.pagador.nome} em{" "}
                            {new Date(d.dataDespesa).toLocaleDateString("pt-BR")}
                          </p>
                          <p className="text-sm font-medium text-amber-800 mt-1">
                            {euComprei
                              ? `Você pagou ${fmt(Number(d.valor))} — as demais te devem ${fmt(parcela)} cada`
                              : `Você deve ${fmt(parcela)} à ${d.pagador.nome}`}
                          </p>
                        </div>
                        <span className="font-semibold text-amber-900 flex-shrink-0">
                          {fmt(Number(d.valor))}
                        </span>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Minhas compras */}
          {minhas.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-gray-600 mb-2">Minhas compras</p>
              <div className="space-y-2">
                {minhas.map(d => (
                  <Card key={d.id} className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 text-sm">{d.descricao}</p>
                      <p className="text-xs text-gray-400">
                        {d.itemCasa?.nome ?? ""}
                        {d.quantidade ? ` · ${Number(d.quantidade)}${d.unidade ? ` ${d.unidade}` : ""}` : ""}
                        {" · "}{new Date(d.dataDespesa).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="font-semibold text-gray-800 text-sm">{fmt(Number(d.valor))}</span>
                      <Button variant="ghost" size="sm" onClick={() => excluir(d.id)}>✕</Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Compras das colegas */}
          {colegas.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-gray-600 mb-2">Compras das colegas</p>
              <div className="space-y-2">
                {colegas.map(d => (
                  <Card key={d.id} className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 text-sm">{d.descricao}</p>
                      <p className="text-xs text-gray-400">
                        {d.pagador.nome}
                        {d.quantidade ? ` · ${Number(d.quantidade)}${d.unidade ? ` ${d.unidade}` : ""}` : ""}
                        {" · "}{new Date(d.dataDespesa).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <span className="font-semibold text-gray-600 flex-shrink-0 text-sm">
                      {fmt(Number(d.valor))}
                    </span>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {compras.length === 0 && gasDoMes.length === 0 && (
            <Card>
              <p className="text-gray-500 text-center py-4">Nenhuma compra registrada neste mês.</p>
            </Card>
          )}
        </>
      )}

      <Modal aberto={modalAberto} onFechar={() => setModalAberto(false)} titulo="Registrar compra">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Item da casa</label>
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
              <Input label="Unidade" placeholder="frascos, pacotes…"
                value={form.unidade} onChange={e => setForm({ ...form, unidade: e.target.value })} />
            </div>
          </div>
          <Input label="Observação (opcional)" placeholder="Ex: marca diferente"
            value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} />
          <div className="flex gap-3">
            <div className="flex-1">
              <Input label="Valor (R$)" type="number" step="0.01" min="0.01"
                value={form.valor} onChange={e => setForm({ ...form, valor: e.target.value })} />
            </div>
            <div className="flex-1">
              <DateInput label="Data da compra"
                value={form.dataDespesa} onChange={e => setForm({ ...form, dataDespesa: e.target.value })} />
            </div>
          </div>
          {erro && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-2">{erro}</p>}
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setModalAberto(false)}>Cancelar</Button>
            <Button className="flex-1" onClick={salvar} disabled={salvando}>
              {salvando ? "Salvando…" : "Registrar"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
