import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await req.json();
  const data: Record<string, unknown> = {};
  if (body.titulo !== undefined) data.titulo = body.titulo;
  if (body.descricao !== undefined) data.descricao = body.descricao;
  if (body.areaId !== undefined) data.areaId = body.areaId;
  if (body.periodicidade !== undefined) data.periodicidade = body.periodicidade;
  if (body.vezesNaSemana !== undefined) data.vezesNaSemana = body.vezesNaSemana ? Number(body.vezesNaSemana) : null;
  if (body.ativo !== undefined) data.ativo = body.ativo;

  try {
    const tarefa = await prisma.tarefa.update({
      where: { id: params.id },
      data,
      include: { area: { select: { id: true, nome: true } } },
    });
    return NextResponse.json(tarefa);
  } catch {
    return NextResponse.json({ error: "Tarefa não encontrada" }, { status: 404 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    await prisma.tarefa.update({ where: { id: params.id }, data: { ativo: false } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Tarefa não encontrada" }, { status: 404 });
  }
}
