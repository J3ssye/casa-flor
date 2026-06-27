import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireAdmin } from "@/lib/permissions";

export async function GET(req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error || !session) return error!;

  const isAdmin = session.user.role === "ADMIN";

  if (isAdmin) {
    const reclamacoes = await prisma.reclamacao.findMany({
      orderBy: { criadoEm: "desc" },
      select: {
        id: true,
        conteudo: true,
        categoria: true,
        anonima: true,
        status: true,
        respostaAdmin: true,
        criadoEm: true,
        // autor só exposto quando NÃO for anônima
        autor: {
          select: { nome: true },
        },
      },
    });

    // Oculta o nome do autor quando a reclamação é anônima
    const resultado = reclamacoes.map((r) => ({
      ...r,
      autor: r.anonima ? null : r.autor,
    }));

    return NextResponse.json(resultado);
  }

  // Moradora vê apenas as próprias reclamações
  const reclamacoes = await prisma.reclamacao.findMany({
    where: { autorId: session.user.id },
    orderBy: { criadoEm: "desc" },
    select: {
      id: true,
      conteudo: true,
      categoria: true,
      anonima: true,
      status: true,
      respostaAdmin: true,
      criadoEm: true,
    },
  });

  return NextResponse.json(reclamacoes);
}

export async function POST(req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error || !session) return error!;

  const { conteudo, categoria, anonima } = await req.json();
  if (!conteudo) return NextResponse.json({ error: "conteudo é obrigatório" }, { status: 400 });

  const reclamacao = await prisma.reclamacao.create({
    data: {
      conteudo,
      categoria: categoria ?? "OUTRO",
      anonima: !!anonima,
      autorId: session.user.id,
    },
  });

  return NextResponse.json(reclamacao, { status: 201 });
}
