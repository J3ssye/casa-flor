"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import DateInput from "@/components/ui/DateInput";

interface Aviso {
  id: string;
  titulo: string;
  conteudo: string;
  dataValidade: string | null;
  criadoEm: string;
  autor: { nome: string };
  _count: { leituras: number };
}

const formVazio = { titulo: "", conteudo: "", dataValidade: "" };

export default function AvisosAdminPage() {
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<Aviso | null>(null);
  const [form, setForm] = useState(formVazio);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  async function carregar() {
    setCarregando(true);
    const res = await fetch("/api/avisos");
    setAvisos(await res.json());
    setCarregando(false);
  }

  useEffect(() => { carregar(); }, []);

  function abrirCriacao() {
    setEditando(null);
    setForm(formVazio);
    setErro("");
    setModalAberto(true);
  }

  function abrirEdicao(a: Aviso) {
    setEditando(a);
    setForm({ titulo: a.titulo, conteudo: a.conteudo, dataValidade: a.dataValidade?.split("T")[0] ?? "" });
    setErro("");
    setModalAberto(true);
  }

  async function salvar() {
    setSalvando(true);
    setErro("");
    const url = editando ? `/api/avisos/${editando.id}` : "/api/avisos";
    const res = await fetch(url, {
      method: editando ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, dataValidade: form.dataValidade || null }),
    });
    setSalvando(false);
    if (!res.ok) { setErro((await res.json()).error ?? "Erro ao salvar"); return; }
    setModalAberto(false);
    carregar();
  }

  async function excluir(id: string) {
    if (!confirm("Excluir este aviso?")) return;
    await fetch(`/api/avisos/${id}`, { method: "DELETE" });
    carregar();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Avisos</h1>
        <Button onClick={abrirCriacao} size="lg">+ Novo aviso</Button>
      </div>

      {carregando ? <p className="text-gray-500">Carregando…</p> : avisos.length === 0 ? (
        <Card><p className="text-gray-500 text-center py-4">Nenhum aviso cadastrado.</p></Card>
      ) : (
        <div className="space-y-3">
          {avisos.map((a) => (
            <Card key={a.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{a.titulo}</p>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">{a.conteudo}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-gray-400">por {a.autor.nome}</span>
                    <Badge variant="gray">{a._count.leituras} leitura{a._count.leituras !== 1 ? "s" : ""}</Badge>
                    {a.dataValidade && (
                      <Badge variant="yellow">
                        válido até {new Date(a.dataValidade).toLocaleDateString("pt-BR")}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Button variant="secondary" size="sm" onClick={() => abrirEdicao(a)}>Editar</Button>
                  <Button variant="danger" size="sm" onClick={() => excluir(a.id)}>Excluir</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal aberto={modalAberto} onFechar={() => setModalAberto(false)} titulo={editando ? "Editar aviso" : "Novo aviso"}>
        <div className="space-y-4">
          <Input label="Título" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} placeholder="Título do aviso" />
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Conteúdo</label>
            <textarea
              value={form.conteudo}
              onChange={(e) => setForm({ ...form, conteudo: e.target.value })}
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-400 text-base resize-none"
              placeholder="Escreva o aviso aqui…"
            />
          </div>
          <DateInput label="Válido até (opcional)" value={form.dataValidade} onChange={(e) => setForm({ ...form, dataValidade: e.target.value })} />
          {erro && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-2">{erro}</p>}
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setModalAberto(false)}>Cancelar</Button>
            <Button className="flex-1" onClick={salvar} disabled={salvando}>{salvando ? "Salvando…" : "Publicar"}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
