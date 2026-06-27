"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Link from "next/link";

const CATEGORIAS = [
  { value: "LIMPEZA", label: "Limpeza" },
  { value: "BARULHO", label: "Barulho" },
  { value: "CONVIVENCIA", label: "Convivência" },
  { value: "FINANCEIRO", label: "Financeiro" },
  { value: "INFRAESTRUTURA", label: "Infraestrutura" },
  { value: "OUTRO", label: "Outro" },
];

export default function NovaReclamacaoPage() {
  const router = useRouter();
  const [conteudo, setConteudo] = useState("");
  const [categoria, setCategoria] = useState("OUTRO");
  const [anonima, setAnonima] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");

  async function enviar() {
    if (!conteudo.trim()) { setErro("Descreva a reclamação."); return; }
    setEnviando(true);
    setErro("");
    const res = await fetch("/api/reclamacoes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conteudo, categoria, anonima }),
    });
    setEnviando(false);
    if (!res.ok) { setErro((await res.json()).error ?? "Erro ao enviar"); return; }
    router.push("/moradora/reclamacoes");
  }

  return (
    <div className="space-y-6 max-w-lg">
      <div className="flex items-center gap-3">
        <Link href="/moradora/reclamacoes">
          <Button variant="ghost" size="sm">← Voltar</Button>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Nova Reclamação</h1>
      </div>

      <Card>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Categoria</label>
            <select value={categoria} onChange={(e) => setCategoria(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-400 text-base">
              {CATEGORIAS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Descreva a situação</label>
            <textarea
              value={conteudo}
              onChange={(e) => setConteudo(e.target.value)}
              rows={5}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-400 text-base resize-none"
              placeholder="Descreva o problema com detalhes…"
            />
          </div>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={anonima}
              onChange={(e) => setAnonima(e.target.checked)}
              className="mt-1 w-5 h-5 rounded accent-primary-600"
            />
            <div>
              <p className="text-sm font-medium text-gray-800">Enviar de forma anônima</p>
              <p className="text-xs text-gray-500">
                Seu nome não será exibido para a gerência. O conteúdo da reclamação ainda será lido.
              </p>
            </div>
          </label>

          {erro && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-2">{erro}</p>}

          <Button className="w-full" size="lg" onClick={enviar} disabled={enviando}>
            {enviando ? "Enviando…" : "Enviar reclamação"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
