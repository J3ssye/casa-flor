import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/permissions";
import bcrypt from "bcryptjs";

/**
 * PUT /api/perfil/senha
 * Troca a senha da própria usuária (logada), exigindo a senha atual.
 * Body: { senhaAtual, novaSenha }
 */
export async function PUT(req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error || !session) return error!;

  const { senhaAtual, novaSenha } = await req.json();
  if (!senhaAtual || !novaSenha) {
    return NextResponse.json({ error: "Preencha a senha atual e a nova." }, { status: 400 });
  }
  if (String(novaSenha).length < 4) {
    return NextResponse.json({ error: "A nova senha deve ter pelo menos 4 caracteres." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return NextResponse.json({ error: "Usuária não encontrada." }, { status: 404 });

  const confere = await bcrypt.compare(senhaAtual, user.senha);
  if (!confere) return NextResponse.json({ error: "Senha atual incorreta." }, { status: 400 });

  const hash = await bcrypt.hash(novaSenha, 12);
  await prisma.user.update({ where: { id: user.id }, data: { senha: hash } });
  return NextResponse.json({ ok: true });
}
