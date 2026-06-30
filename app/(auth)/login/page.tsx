"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import GuirlandaLogin from "@/components/ui/floral/GuirlandaLogin";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setCarregando(true);
    const res = await signIn("credentials", { email, password: senha, redirect: false });
    setCarregando(false);
    if (res?.error) { setErro("E-mail ou senha incorretos."); return; }
    router.push("/");
  }

  return (
    /* Guirlanda é o container — formulário centralizado dentro dela */
    <div className="relative flex items-center justify-center">
      <GuirlandaLogin size={400} />

      {/* Conteúdo sobreposto à guirlanda */}
      <div className="absolute inset-0 flex flex-col items-center justify-center px-14">
        <h1 className="font-script text-4xl text-primary-700 leading-tight mb-0.5 drop-shadow-sm">
          Casa Flor
        </h1>
        <p className="text-primary-400 text-xs tracking-widest mb-5 uppercase">
          bem-vinda de volta
        </p>

        <form onSubmit={handleSubmit} className="w-full space-y-3">
          <div>
            <label className="block text-xs font-semibold text-primary-800 mb-1 tracking-wide">
              Usuário ou e-mail
            </label>
            <input
              type="text" required value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-primary-200 bg-white/75 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary-300 text-sm text-gray-800 placeholder-primary-300"
              placeholder="seu usuário ou e-mail"
              autoComplete="username"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-primary-800 mb-1 tracking-wide">
              Senha
            </label>
            <input
              type="password" required value={senha}
              onChange={e => setSenha(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-primary-200 bg-white/75 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary-300 text-sm text-gray-800 placeholder-primary-300"
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          {erro && (
            <p className="text-xs text-red-600 bg-red-50/80 rounded-xl px-3 py-2">{erro}</p>
          )}

          <button
            type="submit" disabled={carregando}
            className="w-full py-2.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white font-semibold rounded-xl text-sm transition-colors shadow-sm mt-1"
          >
            {carregando ? "Entrando…" : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
