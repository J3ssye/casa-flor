"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import {
  gerarOcorrencias, agruparPorSemana, calcularConclusao,
  parseDataUTC, labelDia, isoData,
} from "@/lib/ocorrencias";

interface EscalaItem {
  id: string;
  dataInicio: string;
  dataFim: string;
  status: string;
  percentualConclusao: number;
  observacaoMoradora: string | null;
  diasSemana: number[];
  modoDias: string;
  marcacoes: string[];
  marcacoesReais: Record<string, string>; // data programada → data em que foi feita, se diferente
  tarefa: { titulo: string; descricao: string | null; area: { nome: string } };
  responsavel: { id: string; nome: string };
}

function statusVariant(s: string, pct: number): "green" | "yellow" | "red" | "blue" {
  if (s === "CONCLUIDA") return "green";
  if (s === "ATRASADA")  return "red";
  if (pct > 0)           return "blue";
  return "yellow";
}
function statusLabel(s: string, pct: number) {
  if (s === "CONCLUIDA") return "Concluída";
  if (s === "ATRASADA")  return "Atrasada";
  if (pct > 0)           return `${pct}%`;
  return "Pendente";
}

function mesAtual() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** "YYYY-MM-DD" → "Seg 01/06" */
function rotuloData(iso: string) {
  const d = parseDataUTC(iso);
  return `${labelDia(d.getUTCDay())} ${String(d.getUTCDate()).padStart(2, "0")}/${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export default function MinhasTarefasPage() {
  const { data: session } = useSession();
  const [itens, setItens]   = useState<EscalaItem[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [sel, setSel]       = useState<EscalaItem | null>(null);
  const [marc, setMarc]     = useState<string[]>([]);   // datas marcadas do item aberto
  const [marcReais, setMarcReais] = useState<Record<string, string>>({}); // data programada → data real de conclusão
  const [observacao, setObservacao] = useState("");
  const [salvandoObs, setSalvandoObs] = useState(false);
  const [mes, setMes]       = useState(mesAtual());

  async function carregar() {
    setCarregando(true);
    const inicioMes = mes + "-01";
    const fimDate   = new Date(mes + "-01");
    fimDate.setMonth(fimDate.getMonth() + 1);
    fimDate.setDate(0);
    const fimMes = `${mes}-${String(fimDate.getDate()).padStart(2, "0")}`;

    const res = await fetch(`/api/escala?inicio=${inicioMes}&fim=${fimMes}`);
    const todos: EscalaItem[] = await res.json();
    setItens(todos.filter(i => i.responsavel.id === session?.user.id));
    setCarregando(false);
  }

  useEffect(() => {
    if (session?.user.id) carregar();
  }, [session, mes]);

  function abrirModal(item: EscalaItem) {
    setSel(item);
    setMarc(item.marcacoes ?? []);
    setMarcReais(item.marcacoesReais ?? {});
    setObservacao(item.observacaoMoradora ?? "");
  }

  /**
   * Marca/desmarca um dia programado como feito.
   * dataConclusao é o dia em que a tarefa foi de fato realizada, se diferente
   * do dia programado (ex: programada segunda, feita terça) — o calendário
   * passa a exibi-la no dia real, não no programado.
   */
  async function toggleDia(data: string, feito: boolean, dataConclusao?: string) {
    if (!sel) return;
    // Atualização otimista
    setMarc(prev => feito ? (prev.includes(data) ? prev : [...prev, data]) : prev.filter(d => d !== data));
    setMarcReais(prev => {
      if (!feito) { const { [data]: _omit, ...rest } = prev; return rest; }
      if (!dataConclusao || dataConclusao === data) { const { [data]: _omit, ...rest } = prev; return rest; }
      return { ...prev, [data]: dataConclusao };
    });
    const res = await fetch(`/api/escala/${sel.id}/marcacao`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data, feito, dataConclusao }),
    });
    if (res.ok) {
      const d = await res.json();
      setMarc(d.marcacoes);
      setMarcReais(d.marcacoesReais ?? {});
      // Atualiza o item na lista (percentual/status)
      setItens(prev => prev.map(i =>
        i.id === sel.id
          ? { ...i, marcacoes: d.marcacoes, marcacoesReais: d.marcacoesReais ?? {}, percentualConclusao: d.percentual,
              status: d.percentual >= 100 ? "CONCLUIDA" : i.status === "CONCLUIDA" ? "PENDENTE" : i.status }
          : i
      ));
    }
  }

  async function salvarObservacao() {
    if (!sel) return;
    setSalvandoObs(true);
    await fetch(`/api/escala/${sel.id}/progresso`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ observacao: observacao || undefined }),
    });
    setSalvandoObs(false);
    setItens(prev => prev.map(i => i.id === sel.id ? { ...i, observacaoMoradora: observacao || null } : i));
    setSel(null);
  }

  const pendentes  = itens.filter(i => i.status !== "CONCLUIDA");
  const concluidas = itens.filter(i => i.status === "CONCLUIDA");

  // Resumo do item aberto, recalculado a partir do estado local
  const resumo = sel ? calcularConclusao(sel, marc) : null;
  const flex   = sel?.modoDias === "UM_DENTRE" && (sel?.diasSemana?.length ?? 0) > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Minhas Tarefas</h1>
        <input type="month" value={mes} onChange={e => setMes(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-xl text-sm" />
      </div>

      {carregando ? <p className="text-gray-500">Carregando…</p> : (
        <>
          <div className="space-y-3">
            {pendentes.length === 0 && (
              <Card><p className="text-gray-500 text-center py-4">Nenhuma tarefa pendente. 🎉</p></Card>
            )}
            {pendentes.map(item => {
              const r = calcularConclusao(item, item.marcacoes ?? []);
              return (
                <Card key={item.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900">{item.tarefa.titulo}</p>
                      <p className="text-sm text-gray-500">{item.tarefa.area.nome}</p>
                      {item.tarefa.descricao && (
                        <p className="text-xs text-gray-400 mt-0.5">{item.tarefa.descricao}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        até {new Date(item.dataFim).toLocaleDateString("pt-BR")}
                        {r.total > 1 && <span className="ml-1">· {r.feitas}/{r.total} feitas</span>}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex-1 bg-gray-100 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              item.status === "ATRASADA" ? "bg-red-400" : "bg-primary-400"
                            }`}
                            style={{ width: `${item.percentualConclusao}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 w-8 text-right">
                          {item.percentualConclusao}%
                        </span>
                      </div>
                      {item.observacaoMoradora && (
                        <p className="text-xs text-gray-400 mt-1 italic">"{item.observacaoMoradora}"</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <Badge variant={statusVariant(item.status, item.percentualConclusao)}>
                        {statusLabel(item.status, item.percentualConclusao)}
                      </Badge>
                      <Button size="sm" onClick={() => abrirModal(item)}>Marcar</Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {concluidas.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-400 mb-2">Concluídas ({concluidas.length})</p>
              <div className="space-y-2">
                {concluidas.map(item => (
                  <Card key={item.id} className="opacity-60 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-700">{item.tarefa.titulo}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(item.dataFim).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <button onClick={() => abrirModal(item)}>
                      <Badge variant="green">100% ✓</Badge>
                    </button>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {sel && (
        <Modal aberto={!!sel} onFechar={() => setSel(null)} titulo="Marcar tarefa">
          <div className="space-y-5">
            <div className="bg-gray-50 rounded-xl px-4 py-3">
              <p className="font-medium text-gray-800">{sel.tarefa.titulo}</p>
              <p className="text-sm text-gray-500">{sel.tarefa.area.nome}</p>
            </div>

            {/* Resumo */}
            {resumo && (
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-gray-700">Progresso do mês</span>
                  <span className={`text-lg font-bold ${resumo.percentual === 100 ? "text-green-600" : "text-primary-600"}`}>
                    {resumo.feitas}/{resumo.total}
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3">
                  <div className={`h-3 rounded-full transition-all ${resumo.percentual === 100 ? "bg-green-500" : "bg-primary-400"}`}
                    style={{ width: `${resumo.percentual}%` }} />
                </div>
              </div>
            )}

            {/* Caso sem dias fixos: checkbox único */}
            {(sel.diasSemana?.length ?? 0) === 0 && (() => {
              const oc = gerarOcorrencias(sel)[0];
              const feito = marc.includes(oc.data);
              return (
                <button
                  onClick={() => toggleDia(oc.data, !feito)}
                  className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl border-2 transition-colors ${
                    feito ? "bg-green-50 border-green-400" : "bg-white border-gray-200 hover:border-primary-300"
                  }`}>
                  <span className={`w-6 h-6 rounded-md flex items-center justify-center text-white text-sm ${feito ? "bg-green-500" : "bg-gray-300"}`}>
                    {feito ? "✓" : ""}
                  </span>
                  <span className="font-medium text-gray-700">
                    {feito ? "Tarefa concluída" : "Marcar como concluída"}
                  </span>
                </button>
              );
            })()}

            {/* Modo TODOS: checklist de cada dia */}
            {(sel.diasSemana?.length ?? 0) > 0 && !flex && (
              <div className="space-y-2 max-h-72 overflow-y-auto">
                <p className="text-sm font-medium text-gray-700">
                  Marque cada dia ao concluir:
                </p>
                {gerarOcorrencias(sel).map(oc => {
                  const feito = marc.includes(oc.data);
                  const dataReal = marcReais[oc.data] ?? oc.data;
                  return (
                    <div key={oc.data}
                      className={`rounded-xl border transition-colors ${
                        feito ? "bg-green-50 border-green-300" : "bg-white border-gray-200"
                      }`}>
                      <button
                        onClick={() => toggleDia(oc.data, !feito)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:opacity-80">
                        <span className={`w-5 h-5 rounded flex items-center justify-center text-white text-xs flex-shrink-0 ${feito ? "bg-green-500" : "bg-gray-300"}`}>
                          {feito ? "✓" : ""}
                        </span>
                        <span className={`text-sm ${feito ? "text-gray-500 line-through" : "text-gray-700"}`}>
                          {rotuloData(oc.data)}
                        </span>
                      </button>
                      {feito && (
                        <div className="flex items-center gap-2 pl-11 pb-2 -mt-0.5">
                          <span className="text-xs text-gray-400">Feito em:</span>
                          <input
                            type="date"
                            value={dataReal}
                            min={sel.dataInicio.slice(0, 10)}
                            max={isoData(new Date())}
                            onChange={e => toggleDia(oc.data, true, e.target.value)}
                            className="text-xs border border-gray-200 rounded-lg px-2 py-1 text-gray-600"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Modo UM_DENTRE: por semana, escolher um dia */}
            {flex && (
              <div className="space-y-3 max-h-72 overflow-y-auto">
                <p className="text-sm font-medium text-gray-700">
                  Uma vez por semana — escolha o dia em que fez:
                </p>
                {agruparPorSemana(sel).map((sem, i) => {
                  const feitoNaSemana = sem.candidatos.find(c => marc.includes(c.data));
                  return (
                    <div key={sem.semanaIdx}
                      className={`rounded-xl border px-3 py-2.5 ${feitoNaSemana ? "bg-green-50 border-green-300" : "bg-white border-gray-200"}`}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-medium text-gray-500">Semana {i + 1}</span>
                        {feitoNaSemana && <span className="text-xs text-green-600 font-medium">✓ feito {rotuloData(feitoNaSemana.data)}</span>}
                      </div>
                      <div className="flex gap-1.5 flex-wrap">
                        {sem.candidatos.map(c => {
                          const feito = marc.includes(c.data);
                          return (
                            <button key={c.data}
                              onClick={() => toggleDia(c.data, !feito)}
                              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                                feito ? "bg-green-500 text-white border-green-500" : "bg-white text-gray-600 border-gray-300 hover:border-primary-400"
                              }`}>
                              {rotuloData(c.data)}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Observação */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Observação (opcional)</label>
              <textarea value={observacao} onChange={e => setObservacao(e.target.value)} rows={2}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-400 text-base resize-none"
                placeholder="Ex: faltou limpar atrás da geladeira…" />
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setSel(null)}>Fechar</Button>
              <Button className="flex-1" onClick={salvarObservacao} disabled={salvandoObs}>
                {salvandoObs ? "Salvando…" : "Salvar observação"}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
