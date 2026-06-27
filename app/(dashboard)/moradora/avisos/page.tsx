"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

interface LeituraAviso {
  userId: string;
  lidoEm: string;
}

interface Aviso {
  id: string;
  titulo: string;
  conteudo: string;
  dataValidade: string | null;
  criadoEm: string;
  autor: { nome: string };
  leituras: LeituraAviso[];
}

export default function AvisosMoradoraPage() {
  const { data: session } = useSession();
  const [avisos, setAvisos]   = useState<Aviso[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [aberto, setAberto]   = useState<string | null>(null);
  const [confirmando, setConfirmando] = useState<string | null>(null);

  async function carregar() {
    setCarregando(true);
    // Inclui leituras para saber se esta usuária já leu
    const res = await fetch("/api/avisos?comLeituras=1");
    setAvisos(await res.json());
    setCarregando(false);
  }

  useEffect(() => { carregar(); }, []);

  async function marcarLido(id: string) {
    setConfirmando(id);
    await fetch(`/api/avisos/${id}/leitura`, { method: "POST" });
    setConfirmando(null);
    // Atualiza localmente sem re-fetch completo
    setAvisos(prev =>
      prev.map(a =>
        a.id === id
          ? { ...a, leituras: [...a.leituras, { userId: session?.user.id ?? "", lidoEm: new Date().toISOString() }] }
          : a
      )
    );
  }

  function jaLeu(aviso: Aviso) {
    return aviso.leituras.some(l => l.userId === session?.user.id);
  }

  const naoLidos = avisos.filter(a => !jaLeu(a));
  const lidos    = avisos.filter(a => jaLeu(a));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Avisos</h1>
        {naoLidos.length > 0 && (
          <Badge variant="red">{naoLidos.length} não lido{naoLidos.length > 1 ? "s" : ""}</Badge>
        )}
      </div>

      {carregando ? (
        <p className="text-gray-500">Carregando…</p>
      ) : avisos.length === 0 ? (
        <Card><p className="text-gray-500 text-center py-4">Nenhum aviso no momento.</p></Card>
      ) : (
        <>
          {/* Não lidos */}
          {naoLidos.length > 0 && (
            <div className="space-y-3">
              {naoLidos.map(a => (
                <AvisoCard
                  key={a.id}
                  aviso={a}
                  lido={false}
                  aberto={aberto === a.id}
                  confirmando={confirmando === a.id}
                  onToggle={() => setAberto(aberto === a.id ? null : a.id)}
                  onMarcarLido={() => marcarLido(a.id)}
                />
              ))}
            </div>
          )}

          {/* Já lidos */}
          {lidos.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-400 mb-2">
                Já lidos ({lidos.length})
              </p>
              <div className="space-y-2">
                {lidos.map(a => (
                  <AvisoCard
                    key={a.id}
                    aviso={a}
                    lido={true}
                    aberto={aberto === a.id}
                    confirmando={false}
                    onToggle={() => setAberto(aberto === a.id ? null : a.id)}
                    onMarcarLido={() => {}}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function AvisoCard({
  aviso, lido, aberto, confirmando, onToggle, onMarcarLido,
}: {
  aviso: Aviso;
  lido: boolean;
  aberto: boolean;
  confirmando: boolean;
  onToggle: () => void;
  onMarcarLido: () => void;
}) {
  return (
    <Card className={lido ? "opacity-70" : "border-primary-100 shadow-sm"}>
      <div className="flex items-start gap-3">
        {/* Indicador de lido/não lido */}
        <div className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${lido ? "bg-gray-300" : "bg-primary-500"}`} />

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className={`font-medium ${lido ? "text-gray-600" : "text-gray-900"}`}>
              {aviso.titulo}
            </p>
            {lido && <Badge variant="green">✓ Lido</Badge>}
          </div>

          {aberto ? (
            <p className="text-sm text-gray-700 mt-2 whitespace-pre-wrap">{aviso.conteudo}</p>
          ) : (
            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{aviso.conteudo}</p>
          )}

          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <span className="text-xs text-gray-400">
              {aviso.autor.nome} · {new Date(aviso.criadoEm).toLocaleDateString("pt-BR")}
            </span>
            {aviso.dataValidade && (
              <Badge variant="yellow">
                válido até {new Date(aviso.dataValidade).toLocaleDateString("pt-BR")}
              </Badge>
            )}
          </div>

          <div className="mt-3 flex gap-2 flex-wrap">
            <Button variant="ghost" size="sm" onClick={onToggle}>
              {aberto ? "Fechar" : "Ler completo"}
            </Button>
            {!lido && (
              <Button
                size="sm"
                variant="secondary"
                onClick={onMarcarLido}
                disabled={confirmando}
              >
                {confirmando ? "Confirmando…" : "✓ Confirmar leitura"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
