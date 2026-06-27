import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";

// Admin troca o responsável de um item de escala
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { userId } = await req.json();
  if (!userId) return NextResponse.json({ error: "userId é obrigatório" }, { status: 400 });

  const moradora = await prisma.user.findUnique({ where: { id: userId, ativo: true } });
  if (!moradora) return NextResponse.json({ error: "Moradora não encontrada ou inativa" }, { status: 404 });

  try {
    const item = await prisma.escalaItem.update({
      where: { id: params.id },
      data: { userId },
      include: {
        tarefa: { select: { titulo: true } },
        responsavel: { select: { id: true, nome: true } },
      },
    });
    return NextResponse.json(item);
  } catch {
    return NextResponse.json({ error: "Item não encontrado" }, { status: 404 });
  }
}
