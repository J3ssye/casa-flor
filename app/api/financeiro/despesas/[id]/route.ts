import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/permissions";

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const { session, error } = await requireAuth();
  if (error || !session) return error!;

  const despesa = await prisma.despesa.findUnique({ where: { id: params.id } });
  if (!despesa) return NextResponse.json({ error: "Não encontrada" }, { status: 404 });

  // Moradora só pode excluir a própria despesa; admin pode excluir qualquer uma
  if (session.user.role !== "ADMIN" && despesa.pagadorId !== session.user.id) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  await prisma.despesa.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}

/** PUT /api/financeiro/despesas/:id — editar (autora ou admin) */
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { session, error } = await requireAuth();
  if (error || !session) return error!;

  const despesa = await prisma.despesa.findUnique({ where: { id: params.id } });
  if (!despesa) return NextResponse.json({ error: "Não encontrada" }, { status: 404 });

  const isAdmin = session.user.role === "ADMIN";
  // Moradora só edita a própria; admin edita qualquer uma
  if (!isAdmin && despesa.pagadorId !== session.user.id) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const body = await req.json();
  const data: Record<string, unknown> = {};
  if (body.descricao !== undefined) data.descricao = body.descricao;
  if (body.valor !== undefined) data.valor = body.valor;
  if (body.dataDespesa !== undefined) {
    const dt = new Date(body.dataDespesa);
    data.dataDespesa = dt;
    data.mesReferencia = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
  }
  if (body.quantidade !== undefined) data.quantidade = body.quantidade ?? null;
  if (body.unidade !== undefined) data.unidade = body.unidade || null;
  if (body.itemCasaId !== undefined) data.itemCasaId = body.itemCasaId || null;
  if (body.categoria !== undefined) {
    if (body.categoria === "ALUGUEL" && !isAdmin) {
      return NextResponse.json({ error: "Somente admins podem lançar aluguel" }, { status: 403 });
    }
    data.categoria = body.categoria;
  }
  // Só a admin pode trocar quem pagou
  if (isAdmin && body.pagadorId) data.pagadorId = body.pagadorId;

  const atualizada = await prisma.despesa.update({
    where: { id: params.id },
    data,
    include: {
      pagador: { select: { id: true, nome: true } },
      itemCasa: { select: { id: true, nome: true, unidadePadrao: true } },
    },
  });
  return NextResponse.json(atualizada);
}
