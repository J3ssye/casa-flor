"use client";

import { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Link from "next/link";

const STATUS_LABEL: Record<string, string> = { ABERTA: "Aberta", EM_ANALISE: "Em análise", RESOLVIDA: "Resolvida" };
const STATUS_VARIANT: Record<string, "yellow" | "blue" | "green"> = { ABERTA: "yellow", EM_ANALISE: "blue", RESOLVIDA: "green" };
const CATEGORIAS: Record<string, string> = {
  LIMPEZA:"Limpeza",BARULHO:"Barulho",CONVIVENCIA:"Convivência",
  FINANCEIRO:"Financeiro",INFRAESTRUTURA:"Infraestrutura",OUTRO:"Outro",
};

interface Reclamacao {
  id: string; conteudo: string; categoria: string;
  anonima: boolean; status: string; respostaAdmin: string | null; criadoEm: string;
}

export default function ReclamacoesMoradoraPage() {
  const [reclamacoes, setReclamacoes] = useState<Reclamacao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [aberta, setAberta] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/reclamacoes").then(r => r.json()).then(d => { setReclamacoes(d); setCarregando(false); });
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Minhas Reclamações</h1>
        <Link href="/moradora/reclamacoes/nova">
          <Button size="lg">+ Nova</Button>
        </Link>
      </div>

      {carregando ? <p className="text-gray-500">Carregando…</p> : reclamacoes.length === 0 ? (
        <Card><p className="text-gray-500 text-center py-4">Nenhuma reclamação enviada.</p></Card>
      ) : (
        <div className="space-y-3">
          {reclamacoes.map((r) => (
            <Card key={r.id}>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex gap-2 flex-wrap">
                  <Badge variant={STATUS_VARIANT[r.status] ?? "gray"}>{STATUS_LABEL[r.status]}</Badge>
                  <Badge variant="gray">{CATEGORIAS[r.categoria]}</Badge>
                  {r.anonima && <Badge variant="gray">Anônima</Badge>}
                </div>
                <span className="text-xs text-gray-400 flex-shrink-0">
                  {new Date(r.criadoEm).toLocaleDateString("pt-BR")}
                </span>
              </div>
              <p className={`text-sm text-gray-700 ${aberta === r.id ? "" : "line-clamp-2"}`}>{r.conteudo}</p>
              {r.respostaAdmin && aberta === r.id && (
                <div className="mt-3 bg-primary-50 rounded-xl px-4 py-3">
                  <p className="text-xs font-medium text-primary-700 mb-1">Resposta da gerência:</p>
                  <p className="text-sm text-gray-700">{r.respostaAdmin}</p>
                </div>
              )}
              <Button variant="ghost" size="sm" className="mt-2" onClick={() => setAberta(aberta === r.id ? null : r.id)}>
                {aberta === r.id ? "Fechar" : "Ver mais"}
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
