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
