import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";
import { recomputarConclusao } from "@/lib/escala";

function parseDate(s: string) {
  return new Date(s + "T12:00:00.000Z");
}

/** PATCH /api/escala/:id — atualiza responsável, período e/ou dias da semana */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await req.json();
  const { userId, dataInicio, dataFim, diasSemana, modoDias } = body;

  const data: Record<string, unknown> = {};

  if (userId) {
    const moradora = await prisma.user.findFirst({
      where: { id: userId, ativo: true },
    });
    if (!moradora) {
      return NextResponse.json({ error: "Moradora não encontrada ou inativa" }, { status: 400 });
    }
    data.userId = userId;
  }

  if (dataInicio) data.dataInicio = parseDate(dataInicio);
  if (dataFim)    data.dataFim    = parseDate(dataFim);
  if (Array.isArray(diasSemana)) data.diasSemana = diasSemana;
  if (modoDias === "TODOS" || modoDias === "UM_DENTRE") data.modoDias = modoDias;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nenhum campo para atualizar" }, { status: 400 });
  }

  try {
    await prisma.escalaItem.update({ where: { id: params.id }, data });
    // Mudar dias/modo/período altera o total de ocorrências → recalcula progresso
    const item = await recomputarConclusao(params.id);
    return NextResponse.json(item);
  } catch {
    return NextResponse.json({ error: "Item não encontrado" }, { status: 404 });
  }
}

/** DELETE /api/escala/:id — remove um item da escala */
export async function DELETE(
  _: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    await prisma.conclusaoTarefa.deleteMany({ where: { escalaItemId: params.id } });
    await prisma.escalaItem.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Item não encontrado" }, { status: 404 });
  }
}
