import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await req.json();
  const data: Record<string, unknown> = {};
  if (body.titulo !== undefined) data.titulo = body.titulo;
  if (body.conteudo !== undefined) data.conteudo = body.conteudo;
  if (body.dataValidade !== undefined) data.dataValidade = body.dataValidade ? new Date(body.dataValidade) : null;

  try {
    const aviso = await prisma.aviso.update({ where: { id: params.id }, data });
    return NextResponse.json(aviso);
  } catch {
    return NextResponse.json({ error: "Aviso não encontrado" }, { status: 404 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    await prisma.aviso.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Aviso não encontrado" }, { status: 404 });
  }
}
