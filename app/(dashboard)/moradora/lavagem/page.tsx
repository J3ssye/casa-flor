"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";

const DIAS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
const DIAS_CURTO = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

interface Alocacao { id: string; diaSemana: number; slot: number; user: { id: string; nome: string; cor: string | null } }
interface Moradora { id: string; nome: string }
interface Solicitacao {
  id: string; tipo: "PERMANENTE" | "TEMPORARIA"; status: string;
  diaOrigem: number | null; diaDesejado: number | null; dataAlvo: string | null;
  observacao: string | null; criadoEm: string;
  solicitante: { id: string; nome: string }; contraparte: { id: string; nome: string } | null;
}

const STATUS_VARIANT: Record<string, "yellow" | "green" | "red" | "gray"> = {
  PENDENTE: "yellow", APROVADA: "green", RECUSADA: "red", CANCELADA: "gray",
};
const STATUS_LABEL: Record<string, string> = {
  PENDENTE: "Pendente", APROVADA: "Aprovada", RECUSADA: "Recusada", CANCELADA: "Cancelada",
};

function hojeISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function LavagemMoradoraPage() {
  const { data: session } = useSession();
  const meuId = session?.user.id;

  const [escala, setEscala] = useState<Alocacao[]>([]);
  const [moradoras, setMoradoras] = useState<Moradora[]>([]);
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([]);
  const [carregando, setCarregando] = useState(true);

  // Modal de nova solicitação
  const [modalTipo, setModalTipo] = useState<"PERMANENTE" | "TEMPORARIA" | null>(null);
  const [comContraparte, setComContraparte] = useState(false);
  const [contraparteId, setContraparteId] = useState("");
  const [diaOrigem, setDiaOrigem] = useState<number | "">("");
  const [diaDesejado, setDiaDesejado] = useState<number | "">("");
  const [dataAlvo, setDataAlvo] = useState("");
  const [observacao, setObservacao] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");

  const carregar = useCallback(async () => {
    setCarregando(true);
    const [eRes, mRes, sRes] = await Promise.all([
      fetch("/api/lavagem/escala"),
      fetch("/api/moradoras/ativas"),
      fetch("/api/lavagem/solicitacoes"),
    ]);
    setEscala(await eRes.json());
    setMoradoras(await mRes.json());
    setSolicitacoes(await sRes.json());
    setCarregando(false);
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  // Minhas solicitações pendentes por tipo (controlam o estado dos botões)
  const pendentePorTipo = (tipo: string) =>
    solicitacoes.find(s => s.solicitante.id === meuId && s.tipo === tipo && s.status === "PENDENTE");

  const minhasFinalizadas = solicitacoes
    .filter(s => s.solicitante.id === meuId && s.status !== "PENDENTE")
    .slice(0, 5);

  // Escala agrupada por dia da semana
  const porDia = Array.from({ length: 7 }, (_, d) => escala.filter(a => a.diaSemana === d));

  function abrirModal(tipo: "PERMANENTE" | "TEMPORARIA") {
    setModalTipo(tipo);
    setComContraparte(false);
    setContraparteId("");
    setDiaOrigem("");
    setDiaDesejado("");
    setDataAlvo("");
    setObservacao("");
    setErro("");
  }

  async function enviar() {
    if (!modalTipo) return;
    setErro("");

    const body: Record<string, unknown> = {
      tipo: modalTipo,
      contraparteId: comContraparte ? contraparteId : null,
      observacao: observacao.trim() || null,
    };
    if (modalTipo === "PERMANENTE") {
      if (diaDesejado === "") { setErro("Escolha o dia desejado."); return; }
      body.diaDesejado = diaDesejado;
      if (comContraparte) {
        if (diaOrigem === "") { setErro("Escolha o seu dia atual para permutar."); return; }
        body.diaOrigem = diaOrigem;
      } else if (diaOrigem !== "") {
        body.diaOrigem = diaOrigem;
      }
    } else {
      if (!dataAlvo) { setErro("Escolha a data da troca."); return; }
      body.dataAlvo = dataAlvo;
    }
    if (comContraparte && !contraparteId) { setErro("Escolha a contraparte."); return; }

    setEnviando(true);
    const res = await fetch("/api/lavagem/solicitacoes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setEnviando(false);
    if (!res.ok) { setErro((await res.json()).error ?? "Erro ao enviar."); return; }
    setModalTipo(null);
    carregar();
  }

  async function cancelar(id: string) {
    if (!confirm("Cancelar esta solicitação?")) return;
    const res = await fetch(`/api/lavagem/solicitacoes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ acao: "cancelar" }),
    });
    if (!res.ok) { alert((await res.json()).error ?? "Erro ao cancelar."); return; }
    carregar();
  }

  function resumoPedido(s: Solicitacao) {
    if (s.tipo === "TEMPORARIA") {
      const d = s.dataAlvo ? new Date(s.dataAlvo).toLocaleDateString("pt-BR") : "—";
      return s.contraparte
        ? `Dia ${d}: ${s.contraparte.nome} lava no seu lugar`
        : `Quer lavar no dia ${d}`;
    }
    const desejado = s.diaDesejado != null ? DIAS[s.diaDesejado] : "—";
    return s.contraparte
      ? `Permutar ${s.diaOrigem != null ? DIAS[s.diaOrigem] : "—"} ↔ ${desejado} com ${s.contraparte.nome}`
      : `Passar a lavar na ${desejado}`;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Máquina de Lavar</h1>

      {/* Escala da semana */}
      <div>
        <p className="text-sm font-semibold text-gray-600 mb-2 ml-1">Escala da semana</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {porDia.map((alocacoes, dia) => (
            <Card key={dia} className="min-h-[72px]">
              <p className="text-xs font-semibold text-primary-700 mb-1">{DIAS[dia]}</p>
              {alocacoes.length === 0 ? (
                <p className="text-xs text-gray-400">— livre —</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {alocacoes.map(a => (
                    <span key={a.id}
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        a.user.id === meuId ? "bg-primary-600 text-white" : "bg-primary-50 text-primary-700"
                      }`}>
                      {a.user.nome}
                    </span>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>

      {/* Botões de troca dependentes de estado */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {(["PERMANENTE", "TEMPORARIA"] as const).map(tipo => {
          const pend = pendentePorTipo(tipo);
          const titulo = tipo === "PERMANENTE" ? "Troca permanente" : "Troca temporária";
          const desc = tipo === "PERMANENTE"
            ? "Muda a escala fixa daqui em diante."
            : "Vale só para uma data específica.";
          return (
            <Card key={tipo} className="flex flex-col gap-2">
              <div>
                <p className="font-semibold text-gray-900 text-sm">{titulo}</p>
                <p className="text-xs text-gray-500">{desc}</p>
              </div>
              {pend ? (
                <div className="bg-yellow-50 rounded-xl px-3 py-2 space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="yellow">Pendente</Badge>
                    <span className="text-xs text-gray-600">{resumoPedido(pend)}</span>
                  </div>
                  <Button variant="danger" size="sm" onClick={() => cancelar(pend.id)}>
                    Cancelar solicitação
                  </Button>
                </div>
              ) : (
                <Button size="sm" onClick={() => abrirModal(tipo)}>
                  Solicitar {titulo.toLowerCase()}
                </Button>
              )}
            </Card>
          );
        })}
      </div>

      {/* Histórico recente das minhas solicitações */}
      {minhasFinalizadas.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-gray-600 mb-2 ml-1">Solicitações anteriores</p>
          <div className="space-y-2">
            {minhasFinalizadas.map(s => (
              <Card key={s.id} className="flex items-center justify-between gap-2">
                <span className="text-xs text-gray-600">{resumoPedido(s)}</span>
                <Badge variant={STATUS_VARIANT[s.status] ?? "gray"}>{STATUS_LABEL[s.status]}</Badge>
              </Card>
            ))}
          </div>
        </div>
      )}

      {carregando && <p className="text-gray-500">Carregando…</p>}

      {/* Modal de nova solicitação */}
      <Modal
        aberto={modalTipo !== null}
        onFechar={() => setModalTipo(null)}
        titulo={modalTipo === "PERMANENTE" ? "Solicitar troca permanente" : "Solicitar troca temporária"}
      >
        <div className="space-y-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={comContraparte}
              onChange={e => setComContraparte(e.target.checked)}
              className="accent-primary-600 w-4 h-4" />
            <span className="text-sm text-gray-700">Indicar uma moradora específica (permutar)</span>
          </label>

          {comContraparte && (
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Com quem?</label>
              <select value={contraparteId} onChange={e => setContraparteId(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-400 text-base">
                <option value="">— selecione —</option>
                {moradoras.filter(m => m.id !== meuId).map(m => (
                  <option key={m.id} value={m.id}>{m.nome}</option>
                ))}
              </select>
            </div>
          )}

          {modalTipo === "PERMANENTE" ? (
            <>
              {comContraparte && (
                <DiaSelect label="Seu dia atual (a ceder)" value={diaOrigem} onChange={setDiaOrigem} />
              )}
              <DiaSelect label="Dia desejado" value={diaDesejado} onChange={setDiaDesejado} />
            </>
          ) : (
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Data</label>
              <input type="date" min={hojeISO()} value={dataAlvo}
                onChange={e => setDataAlvo(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-400 text-base" />
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Observação (opcional)</label>
            <textarea value={observacao} onChange={e => setObservacao(e.target.value)}
              rows={2} placeholder="Ex: tenho um compromisso nesse dia"
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm" />
          </div>

          {erro && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-2">{erro}</p>}

          <div className="flex gap-3 pt-1">
            <Button variant="secondary" className="flex-1" onClick={() => setModalTipo(null)}>Cancelar</Button>
            <Button className="flex-1" onClick={enviar} disabled={enviando}>
              {enviando ? "Enviando…" : "Enviar solicitação"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function DiaSelect({
  label, value, onChange,
}: { label: string; value: number | ""; onChange: (v: number | "") => void }) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-700 mb-1 block">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value === "" ? "" : Number(e.target.value))}
        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-400 text-base">
        <option value="">— selecione —</option>
        {DIAS.map((d, i) => <option key={i} value={i}>{d}</option>)}
      </select>
    </div>
  );
}
