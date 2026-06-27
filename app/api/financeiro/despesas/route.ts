import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/permissions";

export async function GET(req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error || !session) return error!;

  const { searchParams } = new URL(req.url);
  const mes = searchParams.get("mes");
  const categoria = searchParams.get("categoria");

  const where: Record<string, unknown> = {};
  if (mes) where.mesReferencia = mes;
  if (categoria) where.categoria = categoria;

  const despesas = await prisma.despesa.findMany({
    where,
    orderBy: { dataDespesa: "desc" },
    include: {
      pagador: { select: { id: true, nome: true } },
      itemCasa: { select: { id: true, nome: true, unidadePadrao: true } },
    },
  });

  return NextResponse.json(despesas);
}

export async function POST(req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error || !session) return error!;

  const { descricao, valor, categoria, dataDespesa, pagadorId, itemCasaId, quantidade, unidade } =
    await req.json();

  if (!descricao || !valor || !dataDespesa) {
    return NextResponse.json(
      { error: "descricao, valor e dataDespesa são obrigatórios" },
      { status: 400 }
    );
  }

  if (categoria === "ALUGUEL" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Somente admins podem lançar aluguel" }, { status: 403 });
  }

  const idPagador =
    session.user.role === "ADMIN" && pagadorId ? pagadorId : session.user.id;

  const data = new Date(dataDespesa);
  const mesReferencia = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}`;

  const despesa = await prisma.despesa.create({
    data: {
      descricao,
      valor,
      categoria: categoria ?? "OUTRO",
      dataDespesa: data,
      mesReferencia,
      pagadorId: idPagador,
      itemCasaId: itemCasaId || null,
      quantidade: quantidade ?? null,
      unidade: unidade || null,
    },
    include: {
      pagador: { select: { id: true, nome: true } },
      itemCasa: { select: { id: true, nome: true, unidadePadrao: true } },
    },
  });

  return NextResponse.json(despesa, { status: 201 });
}
