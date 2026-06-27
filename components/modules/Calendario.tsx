"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/ui/Modal";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { gerarOcorrencias, parseDataUTC } from "@/lib/ocorrencias";

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
  tarefa: { titulo: string; area: { nome: string } };
  responsavel: { id: string; nome: string };
}

interface EventoDia {
  item: EscalaItem;
  isFinal: boolean;
  feito: boolean;
  flex: boolean;   // modo "um dentre" → dia candidato
}

const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const DIAS_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const CORES = [
  { bg: "#fce7f3", text: "#9d174d", border: "#f9a8d4" },
  { bg: "#dbeafe", text: "#1e40af", border: "#93c5fd" },
  { bg: "#d1fae5", text: "#065f46", border: "#6ee7b7" },
  { bg: "#fef3c7", text: "#92400e", border: "#fcd34d" },
  { bg: "#ede9fe", text: "#5b21b6", border: "#c4b5fd" },
  { bg: "#fee2e2", text: "#991b1b", border: "#fca5a5" },
  { bg: "#e0f2fe", text: "#0c4a6e", border: "#7dd3fc" },
  { bg: "#fdf4ff", text: "#86198f", border: "#e879f9" },
  { bg: "#ecfdf5", text: "#14532d", border: "#4ade80" },
  { bg: "#fff7ed", text: "#9a3412", border: "#fb923c" },
];

function corPorIdx(idx: number) { return CORES[idx % CORES.length]; }

function statusLabel(s: string, pct: number) {
  if (s === "CONCLUIDA") return "Concluída";
  if (s === "ATRASADA")  return "Atrasada";
  if (pct > 0)           return `${pct}% feito`;
  return "Pendente";
}
function statusVariant(s: string, pct: number): "green" | "yellow" | "red" | "blue" {
  if (s === "CONCLUIDA") return "green";
  if (s === "ATRASADA")  return "red";
  if (pct > 0)           return "blue";
  return "yellow";
}

/**
 * Para um EscalaItem, retorna os dias do mês (1–31) em que ele aparece,
 * com estado de conclusão. Usa a mesma lógica de ocorrências do resto do app.
 */
function gerarEventosMes(
  item: EscalaItem,
  ano: number,
  mes: number  // 0-indexed
): Record<number, EventoDia> {
  const result: Record<number, EventoDia> = {};
  const marc = new Set(item.marcacoes ?? []);
  const flex = item.modoDias === "UM_DENTRE" && (item.diasSemana?.length ?? 0) > 0;

  const fim    = parseDataUTC(item.dataFim);
  const fimDia = fim.getUTCFullYear() === ano && fim.getUTCMonth() === mes ? fim.getUTCDate() : null;

  for (const oc of gerarOcorrencias(item)) {
    const d = parseDataUTC(oc.data);
    if (d.getUTCFullYear() !== ano || d.getUTCMonth() !== mes) continue;
    const dia = d.getUTCDate();
    result[dia] = { item, isFinal: dia === fimDia, feito: marc.has(oc.data), flex };
  }

  return result;
}

export default function Calendario() {
  const hoje = new Date();
  const [ano, setAno] = useState(hoje.getFullYear());
  const [mes, setMes] = useState(hoje.getMonth());
  const [itens, setItens] = useState<EscalaItem[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [itemSelecionado, setItemSelecionado] = useState<EscalaItem | null>(null);
  const [moradoras, setMoradoras] = useState<Record<string, number>>({});

  useEffect(() => {
    async function carregar() {
      setCarregando(true);
      const inicio = `${ano}-${String(mes + 1).padStart(2, "0")}-01`;
      const fimDate = new Date(ano, mes + 1, 0);
      const fim = `${fimDate.getFullYear()}-${String(fimDate.getMonth() + 1).padStart(2, "0")}-${String(fimDate.getDate()).padStart(2, "0")}`;

      const res  = await fetch(`/api/escala?inicio=${inicio}&fim=${fim}`);
      const data: EscalaItem[] = await res.json();
      setItens(data);

      const unique = Array.from(
        new Map(data.map(i => [i.responsavel.id, i.responsavel.nome])).entries()
      ).sort((a, b) => a[1].localeCompare(b[1]));
      const map: Record<string, number> = {};
      unique.forEach(([id], idx) => { map[id] = idx; });
      setMoradoras(map);
      setCarregando(false);
    }
    carregar();
  }, [ano, mes]);

  function navMes(delta: number) {
    const d = new Date(ano, mes + delta, 1);
    setAno(d.getFullYear());
    setMes(d.getMonth());
  }

  const primeiroDia = new Date(ano, mes, 1).getDay();
  const totalDias   = new Date(ano, mes + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(primeiroDia).fill(null),
    ...Array.from({ length: totalDias }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  // Monta mapa dia → lista de EventoDia
  const porDia: Record<number, EventoDia[]> = {};
  itens.forEach(item => {
    const eventos = gerarEventosMes(item, ano, mes);
    Object.entries(eventos).forEach(([dia, ev]) => {
      const d = Number(dia);
      if (!porDia[d]) porDia[d] = [];
      porDia[d].push(ev);
    });
  });

  const legenda = Object.entries(moradoras)
    .sort((a, b) => a[1] - b[1])
    .map(([id, idx]) => ({
      id,
      nome: itens.find(i => i.responsavel.id === id)?.responsavel.nome ?? id,
      cor:  corPorIdx(idx),
    }));

  const mesNome = new Date(ano, mes, 1).toLocaleDateString("pt-BR", {
    month: "long", year: "numeric",
  });

  return (
    <div className="space-y-4">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold text-gray-900 capitalize">
          Calendário — {mesNome}
        </h1>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => navMes(-1)}>‹ Anterior</Button>
          <Button variant="ghost" size="sm"
            onClick={() => { setAno(hoje.getFullYear()); setMes(hoje.getMonth()); }}>
            Hoje
          </Button>
          <Button variant="ghost" size="sm" onClick={() => navMes(1)}>Próximo ›</Button>
        </div>
      </div>

      {/* Legenda moradoras */}
      {legenda.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-gray-400">Moradoras:</span>
          {legenda.map(l => (
            <span key={l.id}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border"
              style={{ backgroundColor: l.cor.bg, color: l.cor.text, borderColor: l.cor.border }}>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: l.cor.text }} />
              {l.nome}
            </span>
          ))}
          <span className="text-xs text-gray-400 ml-1 flex items-center gap-2 flex-wrap">
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded border bg-green-100 border-green-300" /> feito
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded border border-dashed border-gray-400" /> escolher um dia
            </span>
          </span>
        </div>
      )}

      {carregando ? (
        <p className="text-gray-500 py-8 text-center">Carregando…</p>
      ) : (
        <div className="rounded-2xl border border-gray-200 overflow-hidden bg-white">
          {/* Cabeçalho dias da semana */}
          <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
            {DIAS_SEMANA.map(d => (
              <div key={d} className="text-center text-xs font-semibold text-gray-500 py-2">{d}</div>
            ))}
          </div>

          {/* Grid */}
          <div className="grid grid-cols-7">
            {cells.map((dia, idx) => {
              const isHoje =
                dia !== null &&
                dia === hoje.getDate() &&
                mes === hoje.getMonth() &&
                ano === hoje.getFullYear();
              const eventos  = dia ? (porDia[dia] ?? []) : [];
              const visiveis = eventos.slice(0, 3);
              const excedentes = eventos.length - visiveis.length;

              return (
                <div key={idx}
                  className={`min-h-[90px] p-1.5 border-b border-r border-gray-100 ${
                    dia === null ? "bg-gray-50" : "bg-white"
                  }`}>
                  {dia !== null && (
                    <>
                      <span className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full mb-1 ${
                        isHoje ? "bg-primary-500 text-white" : "text-gray-700"
                      }`}>
                        {dia}
                      </span>
                      <div className="space-y-0.5">
                        {visiveis.map((ev, ei) => {
                          const cidx = moradoras[ev.item.responsavel.id] ?? 0;
                          const c    = corPorIdx(cidx);
                          return (
                            <button
                              key={`${ev.item.id}-${ei}`}
                              onClick={() => setItemSelecionado(ev.item)}
                              className={`w-full text-left px-1.5 py-0.5 rounded text-[10px] font-medium truncate transition-opacity hover:opacity-80 relative ${
                                ev.feito ? "border" : ev.flex ? "border border-dashed" : "border"
                              }`}
                              style={{
                                backgroundColor: ev.feito ? "#dcfce7" : c.bg,
                                color:           ev.feito ? "#15803d" : c.text,
                                borderColor:     ev.feito ? "#86efac" : c.border,
                              }}
                              title={`${ev.item.tarefa.titulo} — ${ev.item.responsavel.nome}${ev.feito ? " (feito ✓)" : ev.flex ? " (escolher um dia)" : ev.isFinal ? " (prazo final)" : ""}`}
                            >
                              {ev.feito && (
                                <span className="absolute right-1 top-0.5 text-[8px] text-green-600 font-bold">✓</span>
                              )}
                              {!ev.feito && ev.isFinal && (
                                <span className="absolute right-1 top-0.5 text-[8px] text-red-500 font-bold">✕</span>
                              )}
                              {ev.item.tarefa.titulo}
                            </button>
                          );
                        })}
                        {excedentes > 0 && (
                          <span className="text-[10px] text-gray-400 pl-1">+{excedentes} mais</span>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal detalhe */}
      <Modal aberto={!!itemSelecionado} onFechar={() => setItemSelecionado(null)} titulo="Detalhes da tarefa">
        {itemSelecionado && (
          <div className="space-y-4">
            <div>
              <p className="text-lg font-semibold text-gray-900">{itemSelecionado.tarefa.titulo}</p>
              <p className="text-sm text-gray-500">{itemSelecionado.tarefa.area.nome}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-gray-50 rounded-xl px-3 py-2">
                <p className="text-xs text-gray-400 mb-0.5">Responsável</p>
                <p className="font-medium text-gray-800">{itemSelecionado.responsavel.nome}</p>
              </div>
              <div className="bg-gray-50 rounded-xl px-3 py-2">
                <p className="text-xs text-gray-400 mb-0.5">Status</p>
                <Badge variant={statusVariant(itemSelecionado.status, itemSelecionado.percentualConclusao)}>
                  {statusLabel(itemSelecionado.status, itemSelecionado.percentualConclusao)}
                </Badge>
              </div>
              <div className="bg-gray-50 rounded-xl px-3 py-2">
                <p className="text-xs text-gray-400 mb-0.5">Período</p>
                <p className="font-medium text-gray-800">
                  {new Date(itemSelecionado.dataInicio).toLocaleDateString("pt-BR")} –{" "}
                  {new Date(itemSelecionado.dataFim).toLocaleDateString("pt-BR")}
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl px-3 py-2">
                <p className="text-xs text-gray-400 mb-0.5">Prazo final</p>
                <p className="font-medium text-red-700">
                  {new Date(itemSelecionado.dataFim).toLocaleDateString("pt-BR")}
                </p>
              </div>
            </div>

            {itemSelecionado.diasSemana?.length > 0 && (
              <div className="bg-gray-50 rounded-xl px-3 py-2">
                <p className="text-xs text-gray-400 mb-1.5">
                  {itemSelecionado.modoDias === "UM_DENTRE"
                    ? "Uma vez por semana, em um destes dias"
                    : "Toda semana, em todos estes dias"}
                </p>
                <div className="flex gap-1.5 flex-wrap">
                  {itemSelecionado.diasSemana.map((d, i) => (
                    <span key={d} className="inline-flex items-center gap-1">
                      {i > 0 && (
                        <span className="text-[10px] text-gray-400">
                          {itemSelecionado.modoDias === "UM_DENTRE" ? "ou" : "e"}
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded-full bg-primary-100 text-primary-700 text-xs font-medium">
                        {DIAS_LABELS[d]}
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm text-gray-600">Progresso do mês</p>
                <p className="text-sm font-medium text-gray-900">{itemSelecionado.percentualConclusao}%</p>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${
                    itemSelecionado.percentualConclusao === 100 ? "bg-green-500" :
                    itemSelecionado.status === "ATRASADA"       ? "bg-red-400"   : "bg-primary-400"
                  }`}
                  style={{ width: `${itemSelecionado.percentualConclusao}%` }}
                />
              </div>
            </div>

            {itemSelecionado.observacaoMoradora && (
              <div className="bg-amber-50 rounded-xl px-3 py-2 text-sm text-amber-800 italic">
                "{itemSelecionado.observacaoMoradora}"
              </div>
            )}

            <Button variant="secondary" className="w-full" onClick={() => setItemSelecionado(null)}>
              Fechar
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
