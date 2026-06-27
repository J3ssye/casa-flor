"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";

interface EscalaItem {
  id: string;
  dataInicio: string;
  dataFim: string;
  status: string;
  percentualConclusao: number;
  observacaoMoradora: string | null;
  diasSemana: number[];
  modoDias: string;
  tarefa: { titulo: string; area: { nome: string } };
  responsavel: { id: string; nome: string };
}

interface Moradora { id: string; nome: string }
interface Tarefa   { id: string; titulo: string; area: { id: string; nome: string } }
interface Area     { id: string; nome: string }

const DIAS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function statusVariant(s: string, pct: number): "green" | "yellow" | "red" | "blue" {
  if (s === "CONCLUIDA") return "green";
  if (s === "ATRASADA")  return "red";
  if (pct > 0)           return "blue";
  return "yellow";
}
function statusLabel(s: string, pct: number) {
  if (s === "CONCLUIDA") return "Concluída";
  if (s === "ATRASADA")  return "Atrasada";
  if (pct > 0)           return `${pct}% feito`;
  return "Pendente";
}

function mesAtual() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** Retorna inicio (1º dia) e fim (último dia) do mês como strings "YYYY-MM-DD". */
function intervaloMes(mes: string) {
  const inicio = `${mes}-01`;
  const [y, m] = mes.split("-").map(Number);
  const ultimoDia = new Date(y, m, 0).getDate(); // dia 0 do mês seguinte = último do atual
  const fim = `${mes}-${String(ultimoDia).padStart(2, "0")}`;
  return { inicio, fim };
}

function DiasCheckbox({ value, onChange }: { value: number[]; onChange: (v: number[]) => void }) {
  function toggle(d: number) {
    onChange(value.includes(d) ? value.filter(x => x !== d) : [...value, d].sort());
  }
  return (
    <div>
      <label className="text-sm font-medium text-gray-700 mb-2 block">
        Dias da semana <span className="text-gray-400 font-normal">(deixe vazio = apenas prazo final)</span>
      </label>
      <div className="flex gap-1.5 flex-wrap">
        {DIAS.map((label, idx) => (
          <button
            key={idx} type="button"
            onClick={() => toggle(idx)}
            className={`px-3 py-1.5 rounded-xl text-sm font-medium border transition-colors ${
              value.includes(idx)
                ? "bg-primary-600 text-white border-primary-600"
                : "bg-white text-gray-600 border-gray-300 hover:border-primary-400"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

function ModoSelector({
  value, onChange, dias,
}: { value: string; onChange: (v: string) => void; dias: number[] }) {
  const nomes = dias.map(d => DIAS[d]);
  const exemploE  = nomes.length >= 2 ? `${nomes.slice(0, -1).join(", ")} e ${nomes.slice(-1)}` : nomes.join("");
  const exemploOU = nomes.length >= 2 ? `${nomes.slice(0, -1).join(", ")} ou ${nomes.slice(-1)}` : nomes.join("");
  return (
    <div className="space-y-2 bg-gray-50 rounded-xl p-4">
      <p className="text-sm font-medium text-gray-700">Como deve ser feita?</p>
      <label className="flex items-start gap-3 cursor-pointer">
        <input type="radio" checked={value === "TODOS"} onChange={() => onChange("TODOS")}
          className="accent-primary-600 w-4 h-4 mt-0.5" />
        <span className="text-sm text-gray-700">
          <span className="font-medium">Em todos os dias</span>
          {nomes.length > 0 && <span className="text-gray-400"> — ex: {exemploE || "—"}</span>}
        </span>
      </label>
      <label className="flex items-start gap-3 cursor-pointer">
        <input type="radio" checked={value === "UM_DENTRE"} onChange={() => onChange("UM_DENTRE")}
          className="accent-primary-600 w-4 h-4 mt-0.5" />
        <span className="text-sm text-gray-700">
          <span className="font-medium">Uma vez por semana</span>
          {nomes.length > 0 && <span className="text-gray-400"> — ex: {exemploOU || "—"} (escolhe um)</span>}
        </span>
      </label>
    </div>
  );
}

export default function EscalaAdminPage() {
  const [mes, setMes]         = useState(mesAtual());
  const [itens, setItens]     = useState<EscalaItem[]>([]);
  const [moradoras, setMoradoras] = useState<Moradora[]>([]);
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [areas, setAreas]     = useState<Area[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [gerando, setGerando] = useState(false);
  const [mensagem, setMensagem] = useState("");

  // Modal editar item
  const [itemEdit, setItemEdit]     = useState<EscalaItem | null>(null);
  const [editResp, setEditResp]     = useState("");
  const [editMes, setEditMes]       = useState(mesAtual());
  const [editDias, setEditDias]     = useState<number[]>([]);
  const [editModo, setEditModo]     = useState("TODOS");
  const [salvando, setSalvando]     = useState(false);

  // Modal redistribuir
  const [redistModal, setRedistModal]       = useState(false);
  const [moradoraSaindo, setMoradoraSaindo] = useState("");
  const [redistribuindo, setRedistribuindo] = useState(false);

  // Modal nova atribuição
  const [novaModal, setNovaModal]         = useState(false);
  const [novaTarefaId, setNovaTarefaId]   = useState("__nova__");
  const [novaTitulo, setNovaTitulo]       = useState("");
  const [novaAreaId, setNovaAreaId]       = useState("");
  const [novaResp, setNovaResp]           = useState("");
  const [novaMes, setNovaMes]             = useState(mesAtual());
  const [novaDias, setNovaDias]           = useState<number[]>([]);
  const [novaModo, setNovaModo]           = useState("TODOS");
  const [criando, setCriando]             = useState(false);
  const [erroNova, setErroNova]           = useState("");

  async function carregar() {
    setCarregando(true);
    const { inicio, fim } = intervaloMes(mes);
    const [iRes, mRes, tRes, aRes] = await Promise.all([
      fetch(`/api/escala?inicio=${inicio}&fim=${fim}`),
      fetch("/api/moradoras"),
      fetch("/api/tarefas"),
      fetch("/api/areas"),
    ]);
    setItens(await iRes.json());
    const m = await mRes.json();
    setMoradoras(m.filter((x: Moradora & { ativo: boolean }) => x.ativo));
    const t = await tRes.json();
    setTarefas(t.filter((x: Tarefa & { ativo: boolean }) => x.ativo));
    const a = await aRes.json();
    setAreas(a.filter((x: Area & { ativo: boolean }) => x.ativo));
    setCarregando(false);
  }

  useEffect(() => { carregar(); }, [mes]);

  async function gerarEscala() {
    setGerando(true);
    setMensagem("");
    const res = await fetch("/api/escala/gerar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mes }),
    });
    const d = await res.json();
    setGerando(false);
    if (d.criados > 0) {
      setMensagem(`✓ ${d.criados} item(ns) criado(s) para ${mes}.`);
    } else {
      setMensagem(
        "Nenhum item criado — a escala deste mês já está completa ou não há tarefas/moradoras ativas."
      );
    }
    carregar();
  }

  function abrirEdicao(item: EscalaItem) {
    setItemEdit(item);
    setEditResp(item.responsavel.id);
    const d = new Date(item.dataInicio);
    setEditMes(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`);
    setEditDias(item.diasSemana ?? []);
    setEditModo(item.modoDias ?? "TODOS");
  }

  async function salvarEdicao() {
    if (!itemEdit) return;
    setSalvando(true);
    const { inicio, fim } = intervaloMes(editMes);
    await fetch(`/api/escala/${itemEdit.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: editResp, dataInicio: inicio, dataFim: fim, diasSemana: editDias, modoDias: editModo }),
    });
    setSalvando(false);
    setItemEdit(null);
    carregar();
  }

  async function excluirItem(id: string) {
    if (!confirm("Remover este item da escala?")) return;
    await fetch(`/api/escala/${id}`, { method: "DELETE" });
    carregar();
  }

  function abrirNovaAtribuicao() {
    setNovaTarefaId(tarefas[0]?.id ?? "__nova__");
    setNovaTitulo("");
    setNovaAreaId(areas[0]?.id ?? "");
    setNovaResp(moradoras[0]?.id ?? "");
    setNovaMes(mes);
    setNovaDias([]);
    setNovaModo("TODOS");
    setErroNova("");
    setNovaModal(true);
  }

  async function criarAtribuicao() {
    if (!novaResp || !novaMes) { setErroNova("Selecione moradora e mês."); return; }
    if (novaTarefaId === "__nova__" && !novaTitulo.trim()) {
      setErroNova("Digite o título da nova tarefa."); return;
    }
    if (novaTarefaId === "__nova__" && !novaAreaId) {
      setErroNova("Selecione a área da nova tarefa."); return;
    }
    setCriando(true);
    setErroNova("");
    const base = { userId: novaResp, mes: novaMes, diasSemana: novaDias, modoDias: novaModo };
    const body =
      novaTarefaId === "__nova__"
        ? { ...base, novaTarefa: { titulo: novaTitulo.trim(), areaId: novaAreaId } }
        : { ...base, tarefaId: novaTarefaId };

    const res = await fetch("/api/escala", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setCriando(false);
    if (!res.ok) { setErroNova((await res.json()).error ?? "Erro ao criar."); return; }
    setNovaModal(false);
    setMensagem("✓ Atribuição criada com sucesso.");
    carregar();
  }

  async function redistribuir() {
    if (!moradoraSaindo) return;
    setRedistribuindo(true);
    const res = await fetch("/api/escala/redistribuir", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: moradoraSaindo }),
    });
    const d = await res.json();
    setRedistribuindo(false);
    setRedistModal(false);
    setMensagem(`✓ ${d.redistribuidos} tarefa(s) redistribuída(s).`);
    carregar();
  }

  const porTarefa = itens.reduce<Record<string, EscalaItem[]>>((acc, item) => {
    const key = item.tarefa.titulo;
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Escala Mensal</h1>
        <div className="flex flex-wrap gap-2 items-center">
          <input type="month" value={mes} onChange={e => setMes(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-xl text-sm" />
          <Button variant="secondary" onClick={abrirNovaAtribuicao}>
            + Nova atribuição
          </Button>
          <Button onClick={gerarEscala} disabled={gerando}>
            {gerando ? "Gerando…" : "Gerar escala automática"}
          </Button>
          <Button variant="secondary" onClick={() => { setRedistModal(true); setMoradoraSaindo(""); }}>
            Redistribuir tarefas
          </Button>
        </div>
      </div>

      {mensagem && (
        <p className="text-sm font-medium text-green-700 bg-green-50 rounded-xl px-4 py-2">
          {mensagem}
        </p>
      )}

      {carregando ? <p className="text-gray-500">Carregando…</p> :
        Object.keys(porTarefa).length === 0 ? (
          <Card>
            <p className="text-gray-500 text-center py-4">
              Nenhuma tarefa para este mês. Clique em "Nova atribuição" ou "Gerar escala automática".
            </p>
          </Card>
        ) : (
          Object.entries(porTarefa).map(([titulo, items]) => (
            <div key={titulo}>
              <p className="text-sm font-semibold text-gray-600 mb-2 ml-1">{titulo}</p>
              <div className="space-y-2">
                {items.map(item => (
                  <Card key={item.id} className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-primary-700">
                          {item.responsavel.nome}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(item.dataInicio).toLocaleDateString("pt-BR")} –{" "}
                          {new Date(item.dataFim).toLocaleDateString("pt-BR")}
                        </span>
                        {item.diasSemana?.length > 0 && (
                          <span className="text-xs text-primary-600 bg-primary-50 rounded-full px-2 py-0.5">
                            {(() => {
                              const ns = item.diasSemana.map(d => DIAS[d]);
                              const conn = item.modoDias === "UM_DENTRE" ? " ou " : " e ";
                              const txt = ns.length >= 2
                                ? `${ns.slice(0, -1).join(", ")}${conn}${ns.slice(-1)}`
                                : ns.join("");
                              return item.modoDias === "UM_DENTRE" ? `1×/semana: ${txt}` : txt;
                            })()}
                          </span>
                        )}
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex-1 bg-gray-100 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              item.percentualConclusao === 100 ? "bg-green-500" :
                              item.status === "ATRASADA" ? "bg-red-400" : "bg-primary-400"
                            }`}
                            style={{ width: `${item.percentualConclusao}%` }}
                          />
                        </div>
                        <Badge variant={statusVariant(item.status, item.percentualConclusao)}>
                          {statusLabel(item.status, item.percentualConclusao)}
                        </Badge>
                      </div>
                      {item.observacaoMoradora && (
                        <p className="text-xs text-gray-400 mt-1 italic">
                          "{item.observacaoMoradora}"
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <Button variant="secondary" size="sm" onClick={() => abrirEdicao(item)}>
                        Editar
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => excluirItem(item.id)}>
                        ✕
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))
        )
      }

      {/* ── Modal nova atribuição ── */}
      <Modal aberto={novaModal} onFechar={() => setNovaModal(false)} titulo="Nova atribuição">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Tarefa</label>
            <select value={novaTarefaId} onChange={e => setNovaTarefaId(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-400 text-base">
              {tarefas.map(t => (
                <option key={t.id} value={t.id}>{t.titulo} — {t.area.nome}</option>
              ))}
              <option value="__nova__">+ Criar nova tarefa…</option>
            </select>
          </div>

          {novaTarefaId === "__nova__" && (
            <div className="space-y-3 bg-primary-50 rounded-xl p-4 border border-primary-100">
              <p className="text-xs font-semibold text-primary-700 uppercase tracking-wide">Nova tarefa</p>
              <Input label="Título" value={novaTitulo}
                onChange={e => setNovaTitulo(e.target.value)}
                placeholder="Ex: Lavar o banheiro" />
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Área</label>
                <select value={novaAreaId} onChange={e => setNovaAreaId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-400 text-base">
                  <option value="">— selecione —</option>
                  {areas.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
                </select>
              </div>
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Responsável</label>
            <select value={novaResp} onChange={e => setNovaResp(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-400 text-base">
              <option value="">— selecione —</option>
              {moradoras.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Mês</label>
            <input type="month" value={novaMes} onChange={e => setNovaMes(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-400 text-base" />
          </div>

          <DiasCheckbox value={novaDias} onChange={setNovaDias} />

          {novaDias.length > 0 && (
            <ModoSelector value={novaModo} onChange={setNovaModo} dias={novaDias} />
          )}

          {erroNova && (
            <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-2">{erroNova}</p>
          )}

          <div className="flex gap-3 pt-1">
            <Button variant="secondary" className="flex-1" onClick={() => setNovaModal(false)}>Cancelar</Button>
            <Button className="flex-1" onClick={criarAtribuicao} disabled={criando}>
              {criando ? "Criando…" : "Criar atribuição"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Modal editar item ── */}
      <Modal aberto={!!itemEdit} onFechar={() => setItemEdit(null)} titulo="Editar item da escala">
        {itemEdit && (
          <div className="space-y-4">
            <div className="bg-primary-50 rounded-xl px-4 py-3 text-sm">
              <p className="font-semibold text-primary-800">{itemEdit.tarefa.titulo}</p>
              <p className="text-primary-400 text-xs mt-0.5">{itemEdit.tarefa.area.nome}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Responsável</label>
              <select value={editResp} onChange={e => setEditResp(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-400 text-base">
                {moradoras.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Mês da escala</label>
              <input type="month" value={editMes} onChange={e => setEditMes(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-400 text-base" />
              <p className="text-xs text-gray-400 mt-1">
                Período: 1º ao último dia do mês selecionado.
              </p>
            </div>

            <DiasCheckbox value={editDias} onChange={setEditDias} />

            {editDias.length > 0 && (
              <ModoSelector value={editModo} onChange={setEditModo} dias={editDias} />
            )}

            <div className="flex gap-3 pt-1">
              <Button variant="secondary" className="flex-1" onClick={() => setItemEdit(null)}>Cancelar</Button>
              <Button className="flex-1" onClick={salvarEdicao} disabled={salvando}>
                {salvando ? "Salvando…" : "Salvar alterações"}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Modal redistribuir ── */}
      <Modal aberto={redistModal} onFechar={() => setRedistModal(false)} titulo="Redistribuir tarefas">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Selecione a moradora que está saindo. Todas as tarefas pendentes dela serão
            redistribuídas automaticamente entre as demais moradoras ativas.
          </p>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Moradora que saiu</label>
            <select value={moradoraSaindo} onChange={e => setMoradoraSaindo(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-400 text-base">
              <option value="">— selecione —</option>
              {moradoras.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
            </select>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setRedistModal(false)}>Cancelar</Button>
            <Button className="flex-1" onClick={redistribuir} disabled={redistribuindo || !moradoraSaindo}>
              {redistribuindo ? "Redistribuindo…" : "Redistribuir"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
