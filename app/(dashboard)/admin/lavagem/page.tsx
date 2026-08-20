"use client";

import { useCallback, useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";

const DIAS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
const MAX_POR_DIA = 2;

interface Alocacao { id: string; diaSemana: number; slot: number; user: { id: string; nome: string; cor: string | null } }
interface Moradora { id: string; nome: string }
interface Solicitacao {
  id: string; tipo: "PERMANENTE" | "TEMPORARIA"; status: string;
  diaOrigem: number | null; diaDesejado: number | null; dataAlvo: string | null;
  observacao: string | null; criadoEm: string;
  solicitante: { id: string; nome: string }; contraparte: { id: string; nome: string } | null;
}

const STATUS_VARIANT: Record<string, "yellow" | "green" | "red" | "gray"> = {
  PENDENTE: "yellow", APROVADA: "green", RECUSADA: "red", CANCELADA: "gray",
};
const STATUS_LABEL: Record<string, string> = {
  PENDENTE: "Pendente", APROVADA: "Aprovada", RECUSADA: "Recusada", CANCELADA: "Cancelada",
};

export default function LavagemAdminPage() {
  const [escala, setEscala] = useState<Alocacao[]>([]);
  const [moradoras, setMoradoras] = useState<Moradora[]>([]);
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [mensagem, setMensagem] = useState("");
  const [processando, setProcessando] = useState<string | null>(null);

  // Modal adicionar à escala base
  const [addDia, setAddDia] = useState<number | null>(null);
  const [addMoradora, setAddMoradora] = useState("");
  const [addErro, setAddErro] = useState("");

  const carregar = useCallback(async () => {
    setCarregando(true);
    const [eRes, mRes, sRes] = await Promise.all([
      fetch("/api/lavagem/escala"),
      fetch("/api/moradoras/ativas"),
      fetch("/api/lavagem/solicitacoes"),
    ]);
    setEscala(await eRes.json());
    setMoradoras(await mRes.json());
    setSolicitacoes(await sRes.json());
    setCarregando(false);
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  const porDia = Array.from({ length: 7 }, (_, d) => escala.filter(a => a.diaSemana === d));
  const pendentes = solicitacoes.filter(s => s.status === "PENDENTE");
  const finalizadas = solicitacoes.filter(s => s.status !== "PENDENTE").slice(0, 10);

  // Conflito: >1 permanente pendente disputando o mesmo dia desejado
  const contagemDestino = pendentes.reduce<Record<number, number>>((acc, s) => {
    if (s.tipo === "PERMANENTE" && s.diaDesejado != null) acc[s.diaDesejado] = (acc[s.diaDesejado] ?? 0) + 1;
    return acc;
  }, {});
  const temConflito = (s: Solicitacao) =>
    s.tipo === "PERMANENTE" && s.diaDesejado != null && (contagemDestino[s.diaDesejado] ?? 0) > 1;

  async function adicionar() {
    if (addDia === null || !addMoradora) { setAddErro("Selecione a moradora."); return; }
    setAddErro("");
    const res = await fetch("/api/lavagem/escala", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: addMoradora, diaSemana: addDia }),
    });
    if (!res.ok) { setAddErro((await res.json()).error ?? "Erro ao adicionar."); return; }
    setAddDia(null);
    carregar();
  }

  async function remover(id: string) {
    if (!confirm("Remover esta moradora do dia?")) return;
    await fetch(`/api/lavagem/escala/${id}`, { method: "DELETE" });
    carregar();
  }

  async function transicionar(id: string, acao: "aprovar" | "recusar") {
    setProcessando(id);
    setMensagem("");
    const res = await fetch(`/api/lavagem/solicitacoes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ acao }),
    });
    setProcessando(null);
    if (!res.ok) { setMensagem(`⚠ ${(await res.json()).error ?? "Erro."}`); return; }
    setMensagem(acao === "aprovar" ? "✓ Solicitação aprovada." : "Solicitação recusada.");
    carregar();
  }

  function resumoPedido(s: Solicitacao) {
    if (s.tipo === "TEMPORARIA") {
      const d = s.dataAlvo ? new Date(s.dataAlvo).toLocaleDateString("pt-BR") : "—";
      return s.contraparte
        ? `${s.solicitante.nome} → ${s.contraparte.nome} lava no dia ${d}`
        : `${s.solicitante.nome} quer lavar no dia ${d}`;
    }
    const desejado = s.diaDesejado != null ? DIAS[s.diaDesejado] : "—";
    return s.contraparte
      ? `${s.solicitante.nome}: permutar ${s.diaOrigem != null ? DIAS[s.diaOrigem] : "—"} ↔ ${desejado} com ${s.contraparte.nome}`
      : `${s.solicitante.nome} quer passar para ${desejado}`;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Máquina de Lavar</h1>

      {mensagem && (
        <p className="text-sm font-medium text-gray-700 bg-primary-50 rounded-xl px-4 py-2">{mensagem}</p>
      )}

      {/* Escala base */}
      <div>
        <p className="text-sm font-semibold text-gray-600 mb-2 ml-1">
          Escala base <span className="text-gray-400 font-normal">(máx. {MAX_POR_DIA} por dia)</span>
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {porDia.map((alocacoes, dia) => (
            <Card key={dia} className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-primary-700">{DIAS[dia]}</p>
                {alocacoes.length < MAX_POR_DIA && (
                  <button onClick={() => { setAddDia(dia); setAddMoradora(""); setAddErro(""); }}
                    className="text-xs text-primary-600 hover:text-primary-800 font-medium">+ Adicionar</button>
                )}
              </div>
              {alocacoes.length === 0 ? (
                <p className="text-xs text-gray-400">— livre —</p>
              ) : (
                <div className="space-y-1">
                  {alocacoes.map(a => (
                    <div key={a.id} className="flex items-center justify-between bg-primary-50 rounded-lg px-2 py-1">
                      <span className="text-xs text-primary-700">{a.user.nome}</span>
                      <button onClick={() => remover(a.id)}
                        className="text-gray-400 hover:text-red-600 text-sm leading-none" aria-label="Remover">×</button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>

      {/* Fila de solicitações */}
      <div>
        <p className="text-sm font-semibold text-gray-600 mb-2 ml-1">
          Solicitações pendentes {pendentes.length > 0 && <Badge variant="yellow">{pendentes.length}</Badge>}
        </p>
        {carregando ? <p className="text-gray-500">Carregando…</p> :
          pendentes.length === 0 ? (
            <Card><p className="text-gray-500 text-center py-3 text-sm">Nenhuma solicitação pendente.</p></Card>
          ) : (
            <div className="space-y-2">
              {pendentes.map(s => (
                <Card key={s.id} className="space-y-2">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={s.tipo === "PERMANENTE" ? "blue" : "gray"}>
                        {s.tipo === "PERMANENTE" ? "Permanente" : "Temporária"}
                      </Badge>
                      {temConflito(s) && <Badge variant="red">Possível conflito</Badge>}
                      <span className="text-sm text-gray-700">{resumoPedido(s)}</span>
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(s.criadoEm).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                  {s.observacao && <p className="text-xs text-gray-500 italic">"{s.observacao}"</p>}
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => transicionar(s.id, "aprovar")}
                      disabled={processando === s.id}>Aprovar</Button>
                    <Button size="sm" variant="secondary" onClick={() => transicionar(s.id, "recusar")}
                      disabled={processando === s.id}>Recusar</Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
      </div>

      {/* Histórico */}
      {finalizadas.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-gray-600 mb-2 ml-1">Histórico recente</p>
          <div className="space-y-2">
            {finalizadas.map(s => (
              <Card key={s.id} className="flex items-center justify-between gap-2">
                <span className="text-xs text-gray-600">{resumoPedido(s)}</span>
                <Badge variant={STATUS_VARIANT[s.status] ?? "gray"}>{STATUS_LABEL[s.status]}</Badge>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Modal adicionar à escala base */}
      <Modal aberto={addDia !== null} onFechar={() => setAddDia(null)}
        titulo={`Adicionar em ${addDia !== null ? DIAS[addDia] : ""}`}>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Moradora</label>
            <select value={addMoradora} onChange={e => setAddMoradora(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-400 text-base">
              <option value="">— selecione —</option>
              {moradoras.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
            </select>
          </div>
          {addErro && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-2">{addErro}</p>}
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setAddDia(null)}>Cancelar</Button>
            <Button className="flex-1" onClick={adicionar}>Adicionar</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
