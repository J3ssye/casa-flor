"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";

const PERIODICIDADES = [
  { value: "DIARIA",    label: "Diária" },
  { value: "SEMANAL",   label: "Semanal" },
  { value: "QUINZENAL", label: "Quinzenal" },
  { value: "MENSAL",    label: "Mensal" },
];

interface Tarefa {
  id: string;
  titulo: string;
  descricao: string | null;
  periodicidade: string;
  vezesNaSemana: number | null;
  ativo: boolean;
  area: { id: string; nome: string };
}

interface Area { id: string; nome: string }

const formVazio = {
  titulo: "", descricao: "", areaId: "",
  periodicidade: "SEMANAL", usarVezes: false, vezesNaSemana: "2",
};

function labelPeriodicidade(t: Tarefa) {
  if (t.vezesNaSemana != null) return `${t.vezesNaSemana}× por semana`;
  return PERIODICIDADES.find(p => p.value === t.periodicidade)?.label ?? t.periodicidade;
}

export default function TarefasPage() {
  const [tarefas, setTarefas]   = useState<Tarefa[]>([]);
  const [areas, setAreas]       = useState<Area[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<Tarefa | null>(null);
  const [form, setForm]         = useState(formVazio);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro]         = useState("");

  async function carregar() {
    setCarregando(true);
    const [tRes, aRes] = await Promise.all([fetch("/api/tarefas"), fetch("/api/areas")]);
    setTarefas(await tRes.json());
    const todasAreas = await aRes.json();
    setAreas(todasAreas.filter((a: Area & { ativo: boolean }) => a.ativo));
    setCarregando(false);
  }

  useEffect(() => { carregar(); }, []);

  function abrirCriacao() {
    setEditando(null);
    setForm({ ...formVazio, areaId: areas[0]?.id ?? "" });
    setErro("");
    setModalAberto(true);
  }

  function abrirEdicao(t: Tarefa) {
    setEditando(t);
    setForm({
      titulo: t.titulo,
      descricao: t.descricao ?? "",
      areaId: t.area.id,
      periodicidade: t.periodicidade,
      usarVezes: t.vezesNaSemana != null,
      vezesNaSemana: t.vezesNaSemana != null ? String(t.vezesNaSemana) : "2",
    });
    setErro("");
    setModalAberto(true);
  }

  async function salvar() {
    setSalvando(true);
    setErro("");

    const payload: Record<string, unknown> = {
      titulo: form.titulo,
      descricao: form.descricao,
      areaId: form.areaId,
      periodicidade: form.periodicidade,
      vezesNaSemana: form.usarVezes ? Number(form.vezesNaSemana) : null,
    };

    const url = editando ? `/api/tarefas/${editando.id}` : "/api/tarefas";
    const res = await fetch(url, {
      method: editando ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSalvando(false);
    if (!res.ok) { setErro((await res.json()).error ?? "Erro ao salvar"); return; }
    setModalAberto(false);
    carregar();
  }

  async function toggleAtivo(t: Tarefa) {
    await fetch(`/api/tarefas/${t.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ativo: !t.ativo }),
    });
    carregar();
  }

  const ativas   = tarefas.filter(t => t.ativo);
  const inativas = tarefas.filter(t => !t.ativo);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Tarefas</h1>
        <Button onClick={abrirCriacao} size="lg">+ Nova tarefa</Button>
      </div>

      {carregando ? <p className="text-gray-500">Carregando…</p> : (
        <div className="space-y-3">
          {ativas.map(t => (
            <Card key={t.id} className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium text-gray-900">{t.titulo}</p>
                {t.descricao && <p className="text-sm text-gray-500">{t.descricao}</p>}
                <div className="flex gap-2 mt-1">
                  <Badge variant="gray">{t.area.nome}</Badge>
                  <Badge variant="blue">{labelPeriodicidade(t)}</Badge>
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Button variant="secondary" size="sm" onClick={() => abrirEdicao(t)}>Editar</Button>
                <Button variant="ghost" size="sm" onClick={() => toggleAtivo(t)}>Desativar</Button>
              </div>
            </Card>
          ))}

          {inativas.length > 0 && (
            <>
              <p className="text-sm font-medium text-gray-400 pt-2">Inativas</p>
              {inativas.map(t => (
                <Card key={t.id} className="flex items-center justify-between gap-3 opacity-60">
                  <p className="font-medium text-gray-700">{t.titulo}</p>
                  <Button variant="secondary" size="sm" onClick={() => toggleAtivo(t)}>Reativar</Button>
                </Card>
              ))}
            </>
          )}
        </div>
      )}

      <Modal aberto={modalAberto} onFechar={() => setModalAberto(false)}
        titulo={editando ? "Editar tarefa" : "Nova tarefa"}>
        <div className="space-y-4">
          <Input label="Título" value={form.titulo}
            onChange={e => setForm({ ...form, titulo: e.target.value })}
            placeholder="Ex: Varrer e limpar o chão" />

          <Input label="Descrição (opcional)" value={form.descricao}
            onChange={e => setForm({ ...form, descricao: e.target.value })}
            placeholder="Detalhes da tarefa…" />

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Área</label>
            <select value={form.areaId} onChange={e => setForm({ ...form, areaId: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-400 text-base">
              {areas.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
            </select>
          </div>

          {/* Periodicidade — enum OU N vezes por semana */}
          <div className="space-y-3 bg-gray-50 rounded-xl p-4">
            <p className="text-sm font-medium text-gray-700">Frequência da tarefa</p>

            <label className="flex items-center gap-3 cursor-pointer">
              <input type="radio" checked={!form.usarVezes}
                onChange={() => setForm({ ...form, usarVezes: false })}
                className="accent-primary-600 w-4 h-4" />
              <span className="text-sm text-gray-700">Periodicidade padrão</span>
            </label>

            {!form.usarVezes && (
              <select value={form.periodicidade}
                onChange={e => setForm({ ...form, periodicidade: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-400 text-base">
                {PERIODICIDADES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            )}

            <label className="flex items-center gap-3 cursor-pointer">
              <input type="radio" checked={form.usarVezes}
                onChange={() => setForm({ ...form, usarVezes: true })}
                className="accent-primary-600 w-4 h-4" />
              <span className="text-sm text-gray-700">N vezes por semana</span>
            </label>

            {form.usarVezes && (
              <div className="flex items-center gap-3">
                <input type="number" min="1" max="7" value={form.vezesNaSemana}
                  onChange={e => setForm({ ...form, vezesNaSemana: e.target.value })}
                  className="w-20 px-3 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-400 text-base text-center" />
                <span className="text-sm text-gray-600">vezes por semana</span>
              </div>
            )}
          </div>

          {erro && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-2">{erro}</p>}

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setModalAberto(false)}>Cancelar</Button>
            <Button className="flex-1" onClick={salvar} disabled={salvando}>
              {salvando ? "Salvando…" : "Salvar"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
