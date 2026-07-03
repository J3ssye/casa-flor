"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import DateInput from "@/components/ui/DateInput";
import { PALETA_CORES, corDaModadora } from "@/lib/cores";

interface Moradora {
  id: string;
  nome: string;
  email: string;
  role: string;
  ativo: boolean;
  entradaEm: string | null;
  saidaPrevista: string | null;
  cor: string | null;
  dataNascimento: string | null;
  foto: string | null;
  criadoEm: string;
}

const formVazio = {
  nome: "", email: "", senha: "", role: "MORADORA",
  entradaEm: "", saidaPrevista: "", indefinida: true, cor: "", dataNascimento: "",
};

function formatarData(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("pt-BR");
}

function labelPermanencia(m: Moradora) {
  if (!m.entradaEm) return null;
  const entrada = formatarData(m.entradaEm);
  if (!m.saidaPrevista) return `Desde ${entrada} · permanência indefinida`;
  return `${entrada} → ${formatarData(m.saidaPrevista)}`;
}

export default function MoradorasPage() {
  const [moradoras, setMoradoras] = useState<Moradora[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<Moradora | null>(null);
  const [form, setForm] = useState(formVazio);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [fotoUrl, setFotoUrl] = useState("");
  const [uploadandoFoto, setUploadandoFoto] = useState(false);

  async function carregar() {
    setCarregando(true);
    const res = await fetch("/api/moradoras");
    setMoradoras(await res.json());
    setCarregando(false);
  }

  useEffect(() => { carregar(); }, []);

  function abrirCriacao() {
    setEditando(null);
    setForm(formVazio);
    setErro("");
    setModalAberto(true);
  }

  function abrirEdicao(m: Moradora) {
    setEditando(m);
    setForm({
      nome: m.nome,
      email: m.email,
      senha: "",
      role: m.role,
      entradaEm: m.entradaEm ? m.entradaEm.split("T")[0] : "",
      saidaPrevista: m.saidaPrevista ? m.saidaPrevista.split("T")[0] : "",
      indefinida: !m.saidaPrevista,
      cor: m.cor ?? "",
      dataNascimento: m.dataNascimento ? m.dataNascimento.split("T")[0] : "",
    });
    setFotoUrl(m.foto ?? "");
    setErro("");
    setModalAberto(true);
  }

  async function handleFotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !editando) return;
    setUploadandoFoto(true);
    const fd = new FormData();
    fd.append("foto", file);
    const res = await fetch(`/api/moradoras/${editando.id}/foto`, { method: "POST", body: fd });
    setUploadandoFoto(false);
    if (res.ok) { const { url } = await res.json(); setFotoUrl(url); }
  }

  async function removerFoto() {
    if (!editando) return;
    await fetch(`/api/moradoras/${editando.id}/foto`, { method: "DELETE" });
    setFotoUrl("");
  }

  async function salvar() {
    setSalvando(true);
    setErro("");

    const url = editando ? `/api/moradoras/${editando.id}` : "/api/moradoras";
    const method = editando ? "PUT" : "POST";

    const body: Record<string, unknown> = {
      nome: form.nome,
      email: form.email,
      role: form.role,
      entradaEm: form.entradaEm || null,
      saidaPrevista: form.indefinida ? null : (form.saidaPrevista || null),
      cor: form.cor || null,
      dataNascimento: form.dataNascimento || null,
    };
    if (form.senha) body.senha = form.senha;
    if (!editando && !form.senha) {
      setErro("Senha obrigatória para nova moradora");
      setSalvando(false);
      return;
    }

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setSalvando(false);

    if (!res.ok) {
      const d = await res.json();
      setErro(d.error ?? "Erro ao salvar");
      return;
    }

    setModalAberto(false);
    carregar();
  }

  async function toggleAtivo(m: Moradora) {
    await fetch(`/api/moradoras/${m.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ativo: !m.ativo }),
    });
    carregar();
  }

  const ativas = moradoras.filter((m) => m.ativo);
  const inativas = moradoras.filter((m) => !m.ativo);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Moradoras</h1>
          <p className="text-sm text-gray-500 mt-0.5">{ativas.length} ativas</p>
        </div>
        <Button onClick={abrirCriacao} size="lg">+ Nova moradora</Button>
      </div>

      {carregando ? (
        <p className="text-gray-500">Carregando…</p>
      ) : (
        <div className="space-y-3">
          {ativas.map((m, i) => (
            <Card key={m.id} className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium text-gray-900 flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full inline-block border border-black/10 flex-shrink-0"
                    style={{ backgroundColor: corDaModadora(m.cor, i).swatch }}
                  />
                  {m.nome}
                </p>
                <p className="text-sm text-gray-500">{m.email}</p>
                {labelPermanencia(m) && (
                  <p className="text-xs text-gray-400 mt-0.5">{labelPermanencia(m)}</p>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Badge variant={m.role === "ADMIN" ? "blue" : "gray"}>
                  {m.role === "ADMIN" ? "Admin" : "Moradora"}
                </Badge>
                <Button variant="secondary" size="sm" onClick={() => abrirEdicao(m)}>Editar</Button>
                <Button variant="ghost" size="sm" onClick={() => toggleAtivo(m)}>Desativar</Button>
              </div>
            </Card>
          ))}

          {inativas.length > 0 && (
            <>
              <p className="text-sm font-medium text-gray-400 pt-2">Inativas</p>
              {inativas.map((m) => (
                <Card key={m.id} className="flex items-center justify-between gap-3 opacity-60">
                  <div>
                    <p className="font-medium text-gray-700">{m.nome}</p>
                    <p className="text-sm text-gray-400">{m.email}</p>
                    {labelPermanencia(m) && (
                      <p className="text-xs text-gray-400 mt-0.5">{labelPermanencia(m)}</p>
                    )}
                  </div>
                  <Button variant="secondary" size="sm" onClick={() => toggleAtivo(m)}>Reativar</Button>
                </Card>
              ))}
            </>
          )}
        </div>
      )}

      <Modal
        aberto={modalAberto}
        onFechar={() => setModalAberto(false)}
        titulo={editando ? "Editar moradora" : "Nova moradora"}
      >
        <div className="space-y-4">
          <Input
            label="Nome completo"
            value={form.nome}
            onChange={(e) => setForm({ ...form, nome: e.target.value })}
            placeholder="Maria Silva"
          />
          <Input
            label="Usuário ou e-mail (login)"
            type="text"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="ex: maria ou maria@email.com"
          />
          <Input
            label={editando ? "Nova senha (deixe em branco para manter)" : "Senha"}
            type="password"
            value={form.senha}
            onChange={(e) => setForm({ ...form, senha: e.target.value })}
            placeholder="••••••••"
          />
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Papel</label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-400 text-base"
            >
              <option value="MORADORA">Moradora</option>
              <option value="ADMIN">Administradora</option>
            </select>
          </div>

          <DateInput
            label="Data de nascimento (aniversário)"
            value={form.dataNascimento}
            onChange={(e) => setForm({ ...form, dataNascimento: e.target.value })}
          />

          {/* Foto de perfil — só disponível em edição (precisa de ID para upload) */}
          {editando && (
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Foto de perfil <span className="text-gray-400 font-normal">(aparece no mural de aniversário)</span>
              </label>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-200">
                  {fotoUrl ? (
                    <img src={fotoUrl} alt="foto" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-xl font-bold">
                      {editando.nome.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="cursor-pointer inline-block">
                    <span className="text-sm text-primary-600 hover:text-primary-800 font-medium underline-offset-2 hover:underline">
                      {uploadandoFoto ? "Enviando…" : fotoUrl ? "Trocar foto" : "Adicionar foto"}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploadandoFoto}
                      onChange={handleFotoUpload}
                    />
                  </label>
                  {fotoUrl && !uploadandoFoto && (
                    <button
                      type="button"
                      onClick={removerFoto}
                      className="text-sm text-red-500 hover:text-red-700 text-left"
                    >
                      Remover foto
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Permanência */}
          <div className="border border-gray-200 rounded-xl p-4 space-y-3">
            <p className="text-sm font-medium text-gray-700">Permanência</p>
            <DateInput
              label="Data de entrada"
              value={form.entradaEm}
              onChange={(e) => setForm({ ...form, entradaEm: e.target.value })}
            />
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.indefinida}
                onChange={(e) => setForm({ ...form, indefinida: e.target.checked, saidaPrevista: "" })}
                className="w-4 h-4 rounded accent-primary-500"
              />
              <span className="text-sm text-gray-700">Permanência indefinida</span>
            </label>
            {!form.indefinida && (
              <DateInput
                label="Saída prevista"
                value={form.saidaPrevista}
                onChange={(e) => setForm({ ...form, saidaPrevista: e.target.value })}
                min={form.entradaEm || undefined}
              />
            )}
          </div>

          {/* Cor da moradora */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">
              Cor da moradora <span className="text-gray-400 font-normal">(calendário e etiquetas)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setForm({ ...form, cor: "" })}
                title="Automática"
                className={`w-9 h-9 rounded-full flex items-center justify-center text-[9px] text-gray-500 bg-gray-100 transition-transform hover:scale-110 ${
                  form.cor === "" ? "ring-2 ring-offset-2 ring-gray-700" : "border border-gray-200"
                }`}
              >
                auto
              </button>
              {PALETA_CORES.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setForm({ ...form, cor: c.key })}
                  title={c.label}
                  className={`w-9 h-9 rounded-full transition-transform hover:scale-110 ${
                    form.cor === c.key ? "ring-2 ring-offset-2 ring-gray-700 border border-white" : "border border-black/10"
                  }`}
                  style={{ backgroundColor: c.swatch }}
                />
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-1.5">
              {form.cor
                ? `Selecionada: ${PALETA_CORES.find((c) => c.key === form.cor)?.label}`
                : "Automática — o sistema escolhe uma cor da paleta."}
            </p>
          </div>

          {erro && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-2">{erro}</p>}

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setModalAberto(false)}>
              Cancelar
            </Button>
            <Button className="flex-1" onClick={salvar} disabled={salvando}>
              {salvando ? "Salvando…" : "Salvar"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
