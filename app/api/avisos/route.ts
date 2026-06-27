import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireAuth } from "@/lib/permissions";

export async function GET(req: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const comLeituras = searchParams.get("comLeituras") === "1";

  const avisos = await prisma.aviso.findMany({
    orderBy: { criadoEm: "desc" },
    include: {
      autor: { select: { nome: true } },
      _count: { select: { leituras: true } },
      // Inclui leituras completas quando solicitado (para moradora checar se já leu)
      ...(comLeituras ? { leituras: { select: { userId: true, lidoEm: true } } } : {}),
    },
  });
  return NextResponse.json(avisos);
}

export async function POST(req: NextRequest) {
  const { session, error } = await requireAdmin();
  if (error || !session) return error!;

  const { titulo, conteudo, dataValidade } = await req.json();
  if (!titulo || !conteudo) {
    return NextResponse.json({ error: "titulo e conteudo são obrigatórios" }, { status: 400 });
  }

  const aviso = await prisma.aviso.create({
    data: {
      titulo,
      conteudo,
      autorId: session.user.id,
      dataValidade: dataValidade ? new Date(dataValidade) : null,
    },
    include: { autor: { select: { nome: true } } },
  });
  return NextResponse.json(aviso, { status: 201 });
}
