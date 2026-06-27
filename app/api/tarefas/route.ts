import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireAuth } from "@/lib/permissions";

export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  const tarefas = await prisma.tarefa.findMany({
    orderBy: { titulo: "asc" },
    include: { area: { select: { id: true, nome: true } } },
  });
  return NextResponse.json(tarefas);
}

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { titulo, descricao, areaId, periodicidade, vezesNaSemana } = await req.json();
  if (!titulo || !areaId) {
    return NextResponse.json({ error: "titulo e areaId são obrigatórios" }, { status: 400 });
  }

  const tarefa = await prisma.tarefa.create({
    data: {
      titulo,
      descricao,
      areaId,
      periodicidade: periodicidade ?? "SEMANAL",
      vezesNaSemana: vezesNaSemana ? Number(vezesNaSemana) : null,
    },
    include: { area: { select: { id: true, nome: true } } },
  });
  return NextResponse.json(tarefa, { status: 201 });
}
