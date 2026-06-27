import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await req.json();
  const data: Record<string, unknown> = {};
  if (body.nome !== undefined) data.nome = body.nome;
  if (body.unidadePadrao !== undefined) data.unidadePadrao = body.unidadePadrao || null;
  if (body.ativo !== undefined) data.ativo = body.ativo;

  try {
    const item = await prisma.itemCasa.update({ where: { id: params.id }, data });
    return NextResponse.json(item);
  } catch {
    return NextResponse.json({ error: "Item não encontrado" }, { status: 404 });
  }
}
