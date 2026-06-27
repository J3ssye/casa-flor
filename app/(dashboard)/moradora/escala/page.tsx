"use client";

import { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

interface EscalaItem {
  id: string;
  dataInicio: string;
  dataFim: string;
  status: string;
  percentualConclusao: number;
  tarefa: { titulo: string; area: { nome: string } };
  responsavel: { id: string; nome: string };
}

function statusVariant(s: string, pct: number): "green" | "yellow" | "red" | "blue" {
  if (s === "CONCLUIDA") return "green";
  if (s === "ATRASADA")  return "red";
  if (pct > 0)           return "blue";
  return "yellow";
}
function statusLabel(s: string, pct: number) {
  if (s === "CONCLUIDA") return "Feita ✓";
  if (s === "ATRASADA")  return "Atrasada";
  if (pct > 0)           return `${pct}%`;
  return "Pendente";
}

function mesAtual() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function EscalaMoradoraPage() {
  const [mes, setMes]     = useState(mesAtual());
  const [itens, setItens] = useState<EscalaItem[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [filtro, setFiltro] = useState<"todas" | "minhas">("todas");

  async function carregar() {
    setCarregando(true);
    const inicioMes = mes + "-01";
    const fimDate   = new Date(mes + "-01");
    fimDate.setMonth(fimDate.getMonth() + 1);
    fimDate.setDate(0);
    const fimMes = fimDate.toISOString().split("T")[0];

    const res = await fetch(`/api/escala?inicio=${inicioMes}&fim=${fimMes}`);
    setItens(await res.json());
    setCarregando(false);
  }

  useEffect(() => { carregar(); }, [mes]);

  // Agrupar por responsável para visualização
  const itensFiltrados = itens; // filtro por nome seria feito com session, omitimos aqui

  const porResponsavel = itensFiltrados.reduce<Record<string, EscalaItem[]>>((acc, item) => {
    const nome = item.responsavel.nome;
    if (!acc[nome]) acc[nome] = [];
    acc[nome].push(item);
    return acc;
  }, {});

  const totalPendentes  = itens.filter(i => i.status === "PENDENTE").length;
  const totalAtrasadas  = itens.filter(i => i.status === "ATRASADA").length;
  const totalConcluidas = itens.filter(i => i.status === "CONCLUIDA").length;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Escala Geral</h1>

      {/* Controles */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <input
          type="month"
          value={mes}
          onChange={e => setMes(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-xl text-sm"
        />
        <div className="flex gap-2 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />{totalConcluidas} concluídas
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" />{totalPendentes} pendentes
          </span>
          {totalAtrasadas > 0 && (
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />{totalAtrasadas} atrasadas
            </span>
          )}
        </div>
      </div>

      {carregando ? (
        <p className="text-gray-500">Carregando…</p>
      ) : itens.length === 0 ? (
        <Card>
          <p className="text-gray-500 text-center py-4">
            Nenhuma tarefa gerada para este mês.
          </p>
        </Card>
      ) : (
        // Agrupado por responsável
        <div className="space-y-6">
          {Object.entries(porResponsavel).map(([nome, tasks]) => (
            <div key={nome}>
              <p className="text-sm font-semibold text-gray-700 mb-2 ml-1">{nome}</p>
              <div className="space-y-2">
                {tasks.map(item => (
                  <Card key={item.id} className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm">{item.tarefa.titulo}</p>
                      <p className="text-xs text-gray-500">{item.tarefa.area.nome}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(item.dataInicio).toLocaleDateString("pt-BR")} –{" "}
                        {new Date(item.dataFim).toLocaleDateString("pt-BR")}
                      </p>
                      {/* Barra de progresso */}
                      {item.percentualConclusao > 0 && item.status !== "CONCLUIDA" && (
                        <div className="mt-1.5 flex items-center gap-2">
                          <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                            <div
                              className="h-1.5 rounded-full bg-primary-400"
                              style={{ width: `${item.percentualConclusao}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-400">{item.percentualConclusao}%</span>
                        </div>
                      )}
                    </div>
                    <Badge variant={statusVariant(item.status, item.percentualConclusao)}>
                      {statusLabel(item.status, item.percentualConclusao)}
                    </Badge>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
