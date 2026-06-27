"use client";

import { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";

const STATUS_OPTIONS = [
  { value: "ABERTA", label: "Aberta", variant: "yellow" as const },
  { value: "EM_ANALISE", label: "Em análise", variant: "blue" as const },
  { value: "RESOLVIDA", label: "Resolvida", variant: "green" as const },
];

const CATEGORIAS: Record<string, string> = {
  LIMPEZA: "Limpeza",
  BARULHO: "Barulho",
  CONVIVENCIA: "Convivência",
  FINANCEIRO: "Financeiro",
  INFRAESTRUTURA: "Infraestrutura",
  OUTRO: "Outro",
};

interface Reclamacao {
  id: string;
  conteudo: string;
  categoria: string;
  anonima: boolean;
  status: string;
  respostaAdmin: string | null;
  criadoEm: string;
  autor: { nome: string } | null;
}

export default function ReclamacoesAdminPage() {
  const [reclamacoes, setReclamacoes] = useState<Reclamacao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [selecionada, setSelecionada] = useState<Reclamacao | null>(null);
  const [resposta, setResposta] = useState("");
  const [novoStatus, setNovoStatus] = useState("");
  const [salvando, setSalvando] = useState(false);

  async function carregar() {
    setCarregando(true);
    const res = await fetch("/api/reclamacoes");
    setReclamacoes(await res.json());
    setCarregando(false);
  }

  useEffect(() => { carregar(); }, []);

  function abrirModal(r: Reclamacao) {
    setSelecionada(r);
    setResposta(r.respostaAdmin ?? "");
    setNovoStatus(r.status);
  }

  async function salvarResposta() {
    if (!selecionada) return;
    setSalvando(true);
    await fetch(`/api/reclamacoes/${selecionada.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: novoStatus, respostaAdmin: resposta }),
    });
    setSalvando(false);
    setSelecionada(null);
    carregar();
  }

  const pendentes = reclamacoes.filter((r) => r.status !== "RESOLVIDA");
  const resolvidas = reclamacoes.filter((r) => r.status === "RESOLVIDA");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Reclamações</h1>

      {carregando ? <p className="text-gray-500">Carregando…</p> : (
        <>
          <div className="space-y-3">
            {pendentes.length === 0 && <Card><p className="text-gray-500 text-center py-4">Nenhuma reclamação pendente.</p></Card>}
            {pendentes.map((r) => (
              <Card key={r.id} className="cursor-pointer hover:border-primary-200 transition-colors" onClick={() => abrirModal(r)}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={STATUS_OPTIONS.find(s => s.value === r.status)?.variant ?? "gray"}>
                        {STATUS_OPTIONS.find(s => s.value === r.status)?.label}
                      </Badge>
                      <Badge variant="gray">{CATEGORIAS[r.categoria] ?? r.categoria}</Badge>
                      {r.anonima && <Badge variant="gray">Anônima</Badge>}
                    </div>
                    <p className="text-sm text-gray-700 line-clamp-2">{r.conteudo}</p>
                    {!r.anonima && r.autor && (
                      <p className="text-xs text-gray-400 mt-1">por {r.autor.nome}</p>
                    )}
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-0">
                    {new Date(r.criadoEm).toLocaleDateString("pt-BR")}
                  </span>
                </div>
              </Card>
            ))}
          </div>

          {resolvidas.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-400 mb-2">Resolvidas ({resolvidas.length})</p>
              <div className="space-y-2">
                {resolvidas.map((r) => (
                  <Card key={r.id} className="opacity-60 cursor-pointer" onClick={() => abrirModal(r)}>
                    <p className="text-sm text-gray-600 line-clamp-1">{r.conteudo}</p>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {selecionada && (
        <Modal aberto={!!selecionada} onFechar={() => setSelecionada(null)} titulo="Reclamação">
          <div className="space-y-4">
            <div className="flex gap-2 flex-wrap">
              <Badge variant={STATUS_OPTIONS.find(s => s.value === selecionada.status)?.variant ?? "gray"}>
                {STATUS_OPTIONS.find(s => s.value === selecionada.status)?.label}
              </Badge>
              <Badge variant="gray">{CATEGORIAS[selecionada.categoria]}</Badge>
              {selecionada.anonima && <Badge variant="gray">Anônima</Badge>}
            </div>

            <div className="bg-gray-50 rounded-xl px-4 py-3">
              <p className="text-sm text-gray-700">{selecionada.conteudo}</p>
              {!selecionada.anonima && selecionada.autor && (
                <p className="text-xs text-gray-400 mt-2">— {selecionada.autor.nome}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Status</label>
              <select
                value={novoStatus}
                onChange={(e) => setNovoStatus(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-400 text-base"
              >
                {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Resposta (opcional)</label>
              <textarea
                value={resposta}
                onChange={(e) => setResposta(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-400 text-base resize-none"
                placeholder="Escreva uma resposta para a moradora…"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="secondary" className="flex-1" onClick={() => setSelecionada(null)}>Cancelar</Button>
              <Button className="flex-1" onClick={salvarResposta} disabled={salvando}>{salvando ? "Salvando…" : "Salvar"}</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
