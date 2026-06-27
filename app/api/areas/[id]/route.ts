import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await req.json();
  const data: Record<string, unknown> = {};
  if (body.nome !== undefined) data.nome = body.nome;
  if (body.descricao !== undefined) data.descricao = body.descricao;
  if (body.periodicidadeLimpeza !== undefined) data.periodicidadeLimpeza = body.periodicidadeLimpeza;
  if (body.ativo !== undefined) data.ativo = body.ativo;

  try {
    const area = await prisma.area.update({ where: { id: params.id }, data });
    return NextResponse.json(area);
  } catch {
    return NextResponse.json({ error: "Área não encontrada" }, { status: 404 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    await prisma.area.update({ where: { id: params.id }, data: { ativo: false } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Área não encontrada" }, { status: 404 });
  }
}
