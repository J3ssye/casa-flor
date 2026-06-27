import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireAuth } from "@/lib/permissions";

export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  const itens = await prisma.itemCasa.findMany({
    where: { ativo: true },
    orderBy: { nome: "asc" },
  });
  return NextResponse.json(itens);
}

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { nome, unidadePadrao } = await req.json();
  if (!nome) {
    return NextResponse.json({ error: "nome é obrigatório" }, { status: 400 });
  }

  const item = await prisma.itemCasa.create({
    data: { nome, unidadePadrao: unidadePadrao || null },
  });
  return NextResponse.json(item, { status: 201 });
}
