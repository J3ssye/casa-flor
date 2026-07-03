"use client";

import { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import CardAniversarioHoje from "@/components/ui/CardAniversarioHoje";
import { corDaModadora } from "@/lib/cores";
import PetalasCaindo from "@/components/ui/floral/PetalasCaindo";
import Margarida from "@/components/ui/floral/Margarida";

interface Aniversariante {
  id: string;
  nome: string;
  cor: string | null;
  dataNascimento: string | null;
  foto?: string | null;
}

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function mesDe(iso: string) { return new Date(iso).getUTCMonth(); }
function diaDe(iso: string) { return new Date(iso).getUTCDate(); }

export default function MuralAniversariantes() {
  const [lista, setLista] = useState<Aniversariante[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [comemorar, setComemorar] = useState(false);

  useEffect(() => {
    (async () => {
      setCarregando(true);
      try {
        const res = await fetch("/api/aniversariantes");
        const data = await res.json();
        setLista(Array.isArray(data) ? data.filter((m: Aniversariante) => m.dataNascimento) : []);
      } catch {
        setLista([]);
      } finally {
        setCarregando(false);
      }
    })();
  }, []);

  const agora = new Date();
  const mesAtual = agora.getMonth();
  const diaAtual = agora.getDate();

  const idxCor: Record<string, number> = {};
  [...lista].sort((a, b) => a.nome.localeCompare(b.nome)).forEach((m, i) => { idxCor[m.id] = i; });

  const doMes = lista
    .filter((m) => mesDe(m.dataNascimento!) === mesAtual)
    .sort((a, b) => diaDe(a.dataNascimento!) - diaDe(b.dataNascimento!));

  function eHoje(m: Aniversariante) {
    return mesDe(m.dataNascimento!) === mesAtual && diaDe(m.dataNascimento!) === diaAtual;
  }

  const aniversariasHoje = doMes.filter(eHoje);

  useEffect(() => {
    if (!carregando && aniversariasHoje.length > 0) setComemorar(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carregando]);

  const porMes: Aniversariante[][] = Array.from({ length: 12 }, () => []);
  lista.forEach((m) => porMes[mesDe(m.dataNascimento!)].push(m));
  porMes.forEach((arr) => arr.sort((a, b) => diaDe(a.dataNascimento!) - diaDe(b.dataNascimento!)));

  return (
    <div className="space-y-6">
      <PetalasCaindo ativo={comemorar} onFim={() => setComemorar(false)} />

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Margarida size={20} />
          <h1 className="font-script text-3xl text-primary-700">Mural de Aniversariantes</h1>
          <Margarida size={20} />
        </div>
        <Button onClick={() => setComemorar(true)}>🌸 Comemorar</Button>
      </div>

      {carregando ? <p className="text-gray-500">Carregando…</p> : (
        <>
          {/* ── Aniversárias de HOJE — cards Polaroid ── */}
          {aniversariasHoje.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-primary-700 mb-3 flex items-center gap-1.5">
                🎂 Hoje é aniversário!
              </p>
              <div className={`flex flex-wrap gap-6 ${aniversariasHoje.length === 1 ? "justify-center" : "justify-start"}`}>
                {aniversariasHoje.map((m) => (
                  <CardAniversarioHoje
                    key={m.id}
                    nome={m.nome}
                    cor={m.cor}
                    idxCor={idxCor[m.id] ?? 0}
                    foto={m.foto}
                    onComemorar={() => setComemorar(true)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ── Aniversariantes do mês ── */}
          <div>
            <p className="text-sm font-semibold text-gray-600 mb-2">
              Aniversariantes de {MESES[mesAtual]}
            </p>
            {doMes.length === 0 ? (
              <Card>
                <p className="text-gray-500 text-center py-3">
                  Nenhuma aniversariante em {MESES[mesAtual]}.
                </p>
              </Card>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {doMes.map((m) => {
                  const c = corDaModadora(m.cor, idxCor[m.id] ?? 0);
                  const hoje = eHoje(m);
                  return (
                    <div
                      key={m.id}
                      className="rounded-2xl border p-4 flex items-center gap-3"
                      style={{ backgroundColor: c.bg, borderColor: c.border }}
                    >
                      {/* Foto ou dia */}
                      {m.foto ? (
                        <img
                          src={m.foto}
                          alt={m.nome}
                          className="w-12 h-12 rounded-full object-cover flex-shrink-0 border-2"
                          style={{ borderColor: c.swatch }}
                        />
                      ) : (
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 text-lg"
                          style={{ backgroundColor: c.swatch }}
                        >
                          {diaDe(m.dataNascimento!)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-semibold truncate" style={{ color: c.text }}>{m.nome}</p>
                        <p className="text-xs" style={{ color: c.text }}>
                          {diaDe(m.dataNascimento!)} de {MESES[mesAtual]}
                          {hoje && " · é hoje! 🎂"}
                        </p>
                      </div>
                      {hoje && (
                        <button
                          onClick={() => setComemorar(true)}
                          className="ml-auto text-xs font-medium px-2.5 py-1 rounded-full bg-white/70 flex-shrink-0"
                          style={{ color: c.text }}
                        >
                          🌸
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Todas as datas — grade dos 12 meses ── */}
          <div>
            <p className="text-sm font-semibold text-gray-600 mb-2">Todas as datas</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {MESES.map((nomeMes, mi) => (
                <div
                  key={mi}
                  className={`rounded-2xl border p-3 bg-white min-h-[96px] ${
                    mi === mesAtual ? "border-primary-300 ring-1 ring-primary-200" : "border-gray-200"
                  }`}
                >
                  <p className={`text-xs font-semibold mb-1.5 ${mi === mesAtual ? "text-primary-700" : "text-gray-500"}`}>
                    {nomeMes}
                  </p>
                  {porMes[mi].length === 0 ? (
                    <p className="text-[11px] text-gray-300">—</p>
                  ) : (
                    <div className="space-y-1">
                      {porMes[mi].map((m) => {
                        const c = corDaModadora(m.cor, idxCor[m.id] ?? 0);
                        return (
                          <div key={m.id} className="flex items-center gap-1.5">
                            {m.foto ? (
                              <img
                                src={m.foto}
                                alt=""
                                className="w-3.5 h-3.5 rounded-full object-cover flex-shrink-0"
                              />
                            ) : (
                              <span
                                className="w-2 h-2 rounded-full flex-shrink-0"
                                style={{ backgroundColor: c.swatch }}
                              />
                            )}
                            <span className="text-[11px] text-gray-700 truncate">
                              <span className="font-medium">{diaDe(m.dataNascimento!)}</span> {m.nome}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
