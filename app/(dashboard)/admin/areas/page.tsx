"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";

const PERIODICIDADES = [
  { value: "DIARIA", label: "Diária" },
  { value: "SEMANAL", label: "Semanal" },
  { value: "QUINZENAL", label: "Quinzenal" },
  { value: "MENSAL", label: "Mensal" },
];

interface Area {
  id: string;
  nome: string;
  descricao: string | null;
  periodicidadeLimpeza: string;
  vezesNaSemanaLimpeza: number | null;
  ativo: boolean;
  _count: { tarefas: number };
}

const formVazio = {
  nome: "", descricao: "", periodicidadeLimpeza: "SEMANAL",
  usarVezes: false, vezesNaSemana: "2",
};

function labelPeriodicidade(a: Area) {
  if (a.vezesNaSemanaLimpeza != null) return `${a.vezesNaSemanaLimpeza}× por semana`;
  return PERIODICIDADES.find(p => p.value === a.periodicidadeLimpeza)?.label ?? a.periodicidadeLimpeza;
}

export default function AreasPage() {
  const [areas, setAreas] = useState<Area[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<Area | null>(null);
  const [form, setForm] = useState(formVazio);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  async function carregar() {
    setCarregando(true);
    const res = await fetch("/api/areas");
    setAreas(await res.json());
    setCarregando(false);
  }

  useEffect(() => { carregar(); }, []);

  function abrirCriacao() {
    setEditando(null);
    setForm(formVazio);
    setErro("");
    setModalAberto(true);
  }

  function abrirEdicao(a: Area) {
    setEditando(a);
    setForm({
      nome: a.nome,
      descricao: a.descricao ?? "",
      periodicidadeLimpeza: a.periodicidadeLimpeza,
      usarVezes: a.vezesNaSemanaLimpeza != null,
      vezesNaSemana: a.vezesNaSemanaLimpeza != null ? String(a.vezesNaSemanaLimpeza) : "2",
    });
    setErro("");
    setModalAberto(true);
  }

  async function salvar() {
    setSalvando(true);
    setErro("");

    const url = editando ? `/api/areas/${editando.id}` : "/api/areas";
    const method = editando ? "PUT" : "POST";

    const payload = {
      nome: form.nome,
      descricao: form.descricao,
      periodicidadeLimpeza: form.periodicidadeLimpeza,
      vezesNaSemanaLimpeza: form.usarVezes ? Number(form.vezesNaSemana) : null,
    };
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSalvando(false);
    if (!res.ok) { setErro((await res.json()).error ?? "Erro ao salvar"); return; }
    setModalAberto(false);
    carregar();
  }

  async function toggleAtivo(a: Area) {
    await fetch(`/api/areas/${a.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ativo: !a.ativo }),
    });
    carregar();
  }

  const ativas = areas.filter((a) => a.ativo);
  const inativas = areas.filter((a) => !a.ativo);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Áreas da Casa</h1>
        <Button onClick={abrirCriacao} size="lg">+ Nova área</Button>
      </div>

      {carregando ? <p className="text-gray-500">Carregando…</p> : (
        <div className="space-y-3">
          {ativas.map((a) => (
            <Card key={a.id} className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium text-gray-900">{a.nome}</p>
                {a.descricao && <p className="text-sm text-gray-500">{a.descricao}</p>}
                <div className="flex gap-2 mt-1">
                  <Badge variant="blue">{labelPeriodicidade(a)}</Badge>
                  <Badge variant="gray">{a._count.tarefas} tarefa{a._count.tarefas !== 1 ? "s" : ""}</Badge>
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Button variant="secondary" size="sm" onClick={() => abrirEdicao(a)}>Editar</Button>
                <Button variant="ghost" size="sm" onClick={() => toggleAtivo(a)}>Desativar</Button>
              </div>
            </Card>
          ))}
          {inativas.length > 0 && (
            <>
              <p className="text-sm font-medium text-gray-400 pt-2">Inativas</p>
              {inativas.map((a) => (
                <Card key={a.id} className="flex items-center justify-between gap-3 opacity-60">
                  <p className="font-medium text-gray-700">{a.nome}</p>
                  <Button variant="secondary" size="sm" onClick={() => toggleAtivo(a)}>Reativar</Button>
                </Card>
              ))}
            </>
          )}
        </div>
      )}

      <Modal aberto={modalAberto} onFechar={() => setModalAberto(false)} titulo={editando ? "Editar área" : "Nova área"}>
        <div className="space-y-4">
          <Input label="Nome da área" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Ex: Cozinha" />
          <Input label="Descrição (opcional)" value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} placeholder="Detalhes sobre a área…" />
          <div className="space-y-3 bg-gray-50 rounded-xl p-4">
            <p className="text-sm font-medium text-gray-700">Periodicidade de limpeza</p>

            <label className="flex items-center gap-3 cursor-pointer">
              <input type="radio" checked={!form.usarVezes}
                onChange={() => setForm({ ...form, usarVezes: false })}
                className="accent-primary-600 w-4 h-4" />
              <span className="text-sm text-gray-700">Periodicidade padrão</span>
            </label>

            {!form.usarVezes && (
              <select value={form.periodicidadeLimpeza}
                onChange={(e) => setForm({ ...form, periodicidadeLimpeza: e.target.value })}
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
                  onChange={(e) => setForm({ ...form, vezesNaSemana: e.target.value })}
                  className="w-20 px-3 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-400 text-base text-center" />
                <span className="text-sm text-gray-600">vezes por semana</span>
              </div>
            )}
          </div>
          {erro && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-2">{erro}</p>}
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setModalAberto(false)}>Cancelar</Button>
            <Button className="flex-1" onClick={salvar} disabled={salvando}>{salvando ? "Salvando…" : "Salvar"}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
