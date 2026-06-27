import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireAuth } from "@/lib/permissions";

export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  const areas = await prisma.area.findMany({
    orderBy: { nome: "asc" },
    include: { _count: { select: { tarefas: { where: { ativo: true } } } } },
  });
  return NextResponse.json(areas);
}

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { nome, descricao, periodicidadeLimpeza } = await req.json();
  if (!nome) return NextResponse.json({ error: "nome é obrigatório" }, { status: 400 });

  const area = await prisma.area.create({
    data: { nome, descricao, periodicidadeLimpeza: periodicidadeLimpeza ?? "SEMANAL" },
  });
  return NextResponse.json(area, { status: 201 });
}
