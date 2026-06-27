import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/permissions";

/**
 * PATCH /api/escala/:id/progresso
 * Atualiza apenas a observação da moradora.
 * O progresso (percentual/status) é derivado das marcações de dias —
 * ver /api/escala/:id/marcacao.
 */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { session, error } = await requireAuth();
  if (error || !session) return error!;

  const item = await prisma.escalaItem.findUnique({ where: { id: params.id } });
  if (!item) return NextResponse.json({ error: "Item não encontrado" }, { status: 404 });

  if (session.user.role !== "ADMIN" && item.userId !== session.user.id) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const { observacao } = await req.json();

  const atualizado = await prisma.escalaItem.update({
    where: { id: params.id },
    data: { observacaoMoradora: observacao ?? null },
    include: {
      tarefa: { include: { area: { select: { nome: true } } } },
      responsavel: { select: { id: true, nome: true } },
    },
  });

  return NextResponse.json(atualizado);
}
