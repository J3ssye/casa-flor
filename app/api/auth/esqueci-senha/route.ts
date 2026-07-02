import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

/** A data guardada é meia-noite UTC do dia escolhido → comparar em UTC. */
function mesmaData(a: Date | null, isoDia: string): boolean {
  if (!a) return false;
  const [y, m, d] = isoDia.slice(0, 10).split("-").map(Number);
  return a.getUTCFullYear() === y && a.getUTCMonth() + 1 === m && a.getUTCDate() === d;
}

/**
 * POST /api/auth/esqueci-senha  (público, sem login)
 * Redefine a senha usando a DATA DE NASCIMENTO como comprovação.
 * Body: { login, dataNascimento, novaSenha }
 * Nunca revela se o usuário existe (erro genérico).
 */
export async function POST(req: NextRequest) {
  const { login, dataNascimento, novaSenha } = await req.json();

  if (!login || !dataNascimento || !novaSenha) {
    return NextResponse.json({ error: "Preencha todos os campos." }, { status: 400 });
  }
  if (String(novaSenha).length < 4) {
    return NextResponse.json({ error: "A nova senha deve ter pelo menos 4 caracteres." }, { status: 400 });
  }

  const erroGenerico = NextResponse.json(
    { error: "Dados não conferem. Confira o usuário e a data de nascimento (ou peça à administradora para redefinir)." },
    { status: 400 }
  );

  const user = await prisma.user.findUnique({ where: { email: login } });
  if (!user || !user.ativo || !mesmaData(user.dataNascimento, dataNascimento)) {
    return erroGenerico;
  }

  const hash = await bcrypt.hash(novaSenha, 12);
  await prisma.user.update({ where: { id: user.id }, data: { senha: hash } });
  return NextResponse.json({ ok: true });
}
