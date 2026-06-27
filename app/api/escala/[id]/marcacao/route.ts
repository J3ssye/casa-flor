import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/permissions";
import { recomputarConclusao } from "@/lib/escala";
import { calcularConclusao, isoData } from "@/lib/ocorrencias";

function parseDate(s: string) {
  return new Date(s.slice(0, 10) + "T12:00:00.000Z");
}

/**
 * POST /api/escala/:id/marcacao
 * Marca ou desmarca uma ocorrência (um dia) como feita.
 * Body: { data: "YYYY-MM-DD", feito: boolean }
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { session, error } = await requireAuth();
  if (error || !session) return error!;

  const item = await prisma.escalaItem.findUnique({ where: { id: params.id } });
  if (!item) return NextResponse.json({ error: "Item não encontrado" }, { status: 404 });

  // Moradora só marca a própria tarefa
  if (session.user.role !== "ADMIN" && item.userId !== session.user.id) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const { data, feito } = await req.json();
  if (!data) return NextResponse.json({ error: "data é obrigatória" }, { status: 400 });

  const dia = parseDate(data);

  if (feito) {
    await prisma.marcacaoTarefa.upsert({
      where:  { escalaItemId_data: { escalaItemId: params.id, data: dia } },
      create: { escalaItemId: params.id, data: dia, userId: session.user.id },
      update: { userId: session.user.id },
    });
  } else {
    await prisma.marcacaoTarefa.deleteMany({
      where: { escalaItemId: params.id, data: dia },
    });
  }

  await recomputarConclusao(params.id);

  // Retorna o resumo atualizado
  const marcacoes = await prisma.marcacaoTarefa.findMany({
    where: { escalaItemId: params.id },
    select: { data: true },
  });
  const datas = marcacoes.map(m => isoData(m.data));
  const resumo = calcularConclusao(
    {
      dataInicio: isoData(item.dataInicio),
      dataFim:    isoData(item.dataFim),
      diasSemana: item.diasSemana,
      modoDias:   item.modoDias,
    },
    datas
  );

  return NextResponse.json({ marcacoes: datas, ...resumo });
}
