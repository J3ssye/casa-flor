"use client";

import { useState } from "react";
import Link from "next/link";
import DateInput from "@/components/ui/DateInput";

export default function EsqueciSenhaPage() {
  const [login, setLogin] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirma, setConfirma] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const [ok, setOk] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    if (novaSenha !== confirma) { setErro("A confirmação não bate com a nova senha."); return; }

    setEnviando(true);
    const res = await fetch("/api/auth/esqueci-senha", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ login, dataNascimento, novaSenha }),
    });
    setEnviando(false);
    if (!res.ok) { setErro((await res.json()).error ?? "Não foi possível redefinir."); return; }
    setOk(true);
  }

  return (
    <div className="w-full max-w-sm mx-auto bg-white/80 backdrop-blur-sm border border-primary-100 rounded-3xl p-7 shadow-sm">
      <h1 className="font-script text-3xl text-primary-700 text-center mb-1">Casa Flor</h1>
      <p className="text-primary-400 text-xs tracking-widest mb-5 uppercase text-center">
        recuperar acesso
      </p>

      {ok ? (
        <div className="space-y-4 text-center">
          <p className="text-sm text-green-700 bg-green-50 rounded-xl px-4 py-3 font-medium">
            ✓ Senha redefinida! Já pode entrar com a nova senha.
          </p>
          <Link href="/login"
            className="inline-block w-full py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl text-sm transition-colors">
            Ir para o login
          </Link>
        </div>
      ) : (
        <form onSubmit={enviar} className="space-y-3">
          <p className="text-xs text-gray-500 mb-1">
            Confirme sua identidade com o usuário e a <strong>data de nascimento</strong> cadastrada,
            e escolha uma nova senha.
          </p>

          <div>
            <label className="block text-xs font-semibold text-primary-800 mb-1 tracking-wide">Usuário ou e-mail</label>
            <input
              type="text" required value={login} onChange={e => setLogin(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-primary-200 bg-white/75 focus:outline-none focus:ring-2 focus:ring-primary-300 text-sm text-gray-800"
              placeholder="seu usuário ou e-mail" autoComplete="username"
            />
          </div>

          <DateInput
            label="Data de nascimento"
            value={dataNascimento}
            onChange={e => setDataNascimento(e.target.value)}
          />

          <div>
            <label className="block text-xs font-semibold text-primary-800 mb-1 tracking-wide">Nova senha</label>
            <input
              type="password" required value={novaSenha} onChange={e => setNovaSenha(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-primary-200 bg-white/75 focus:outline-none focus:ring-2 focus:ring-primary-300 text-sm text-gray-800"
              placeholder="mínimo 4 caracteres" autoComplete="new-password"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-primary-800 mb-1 tracking-wide">Confirmar nova senha</label>
            <input
              type="password" required value={confirma} onChange={e => setConfirma(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-primary-200 bg-white/75 focus:outline-none focus:ring-2 focus:ring-primary-300 text-sm text-gray-800"
              placeholder="repita a nova senha" autoComplete="new-password"
            />
          </div>

          {erro && <p className="text-xs text-red-600 bg-red-50/80 rounded-xl px-3 py-2">{erro}</p>}

          <button type="submit" disabled={enviando}
            className="w-full py-2.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white font-semibold rounded-xl text-sm transition-colors mt-1">
            {enviando ? "Redefinindo…" : "Redefinir senha"}
          </button>

          <Link href="/login" className="block text-center text-xs text-primary-400 hover:text-primary-700 mt-2">
            ← Voltar ao login
          </Link>
        </form>
      )}
    </div>
  );
}
