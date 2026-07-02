"use client";

import { useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function TrocarSenhaPage() {
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirma, setConfirma] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [ok, setOk] = useState(false);

  async function salvar() {
    setErro("");
    setOk(false);
    if (novaSenha !== confirma) { setErro("A confirmação não bate com a nova senha."); return; }
    if (novaSenha.length < 4) { setErro("A nova senha deve ter pelo menos 4 caracteres."); return; }

    setSalvando(true);
    const res = await fetch("/api/perfil/senha", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ senhaAtual, novaSenha }),
    });
    setSalvando(false);
    if (!res.ok) { setErro((await res.json()).error ?? "Erro ao trocar a senha."); return; }
    setOk(true);
    setSenhaAtual(""); setNovaSenha(""); setConfirma("");
  }

  return (
    <div className="max-w-md space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Trocar senha</h1>
      <p className="text-sm text-gray-500">
        Por segurança, informe sua senha atual para definir uma nova.
      </p>

      <Card className="space-y-4">
        <Input label="Senha atual" type="password" value={senhaAtual}
          onChange={e => setSenhaAtual(e.target.value)} placeholder="••••••••" />
        <Input label="Nova senha" type="password" value={novaSenha}
          onChange={e => setNovaSenha(e.target.value)} placeholder="mínimo 4 caracteres" />
        <Input label="Confirmar nova senha" type="password" value={confirma}
          onChange={e => setConfirma(e.target.value)} placeholder="repita a nova senha" />

        {erro && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-2">{erro}</p>}
        {ok && <p className="text-sm text-green-700 bg-green-50 rounded-lg px-4 py-2 font-medium">✓ Senha alterada com sucesso!</p>}

        <Button className="w-full" onClick={salvar}
          disabled={salvando || !senhaAtual || !novaSenha || !confirma}>
          {salvando ? "Salvando…" : "Salvar nova senha"}
        </Button>
      </Card>
    </div>
  );
}
