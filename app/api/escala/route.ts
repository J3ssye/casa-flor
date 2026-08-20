import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireAuth } from "@/lib/permissions";
import { atualizarAtrasados } from "@/lib/escala";

/** Converte "YYYY-MM-DD" para Date ao meio-dia UTC (evita flip de timezone). */
function parseDate(s: string) {
  return new Date(s + "T12:00:00.000Z");
}

export async function GET(req: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  await atualizarAtrasados();

  const { searchParams } = new URL(req.url);
  const inicio = searchParams.get("inicio");
  const fim    = searchParams.get("fim");
  const userId = searchParams.get("userId");

  // Busca itens cujo período SOBREPÕE o intervalo pedido
  const where: Record<string, unknown> = {};
  if (inicio && fim) {
    where.dataInicio = { lte: parseDate(fim) };
    where.dataFim    = { gte: parseDate(inicio) };
  }
  if (userId) where.userId = userId;

  const itens = await prisma.escalaItem.findMany({
    where,
    orderBy: [{ dataInicio: "asc" }, { tarefa: { titulo: "asc" } }],
    include: {
      tarefa: { include: { area: { select: { nome: true } } } },
      responsavel: { select: { id: true, nome: true, cor: true } },
      conclusao: true,
      marcacoes: { select: { data: true, dataConclusao: true } },
    },
  });

  // Serializa marcacoes como array de "YYYY-MM-DD" + mapa de datas reais de conclusão
  // (quando a tarefa foi feita em dia diferente do programado)
  const out = itens.map(i => ({
    ...i,
    marcacoes: i.marcacoes.map(m => m.data.toISOString().slice(0, 10)),
    marcacoesReais: Object.fromEntries(
      i.marcacoes
        .filter(m => m.dataConclusao)
        .map(m => [m.data.toISOString().slice(0, 10), m.dataConclusao!.toISOString().slice(0, 10)])
    ),
  }));

  return NextResponse.json(out);
}

/**
 * POST /api/escala
 * Body: { tarefaId?, novaTarefa?: { titulo, areaId }, userId, mes, diasSemana? }
 * mes = "YYYY-MM"
 */
export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await req.json();
  const { userId, mes, tarefaId, novaTarefa, diasSemana, modoDias } = body;

  if (!userId || !mes) {
    return NextResponse.json({ error: "userId e mes são obrigatórios" }, { status: 400 });
  }

  const dataInicio = parseDate(`${mes}-01`);
  const ultimoDia  = new Date(Date.UTC(
    Number(mes.slice(0, 4)),
    Number(mes.slice(5, 7)),   // month index + 1 (para setDate(0))
    0,                          // dia 0 = último dia do mês anterior
    12, 0, 0
  ));
  const dataFim = ultimoDia;

  let finalTarefaId = tarefaId as string | undefined;

  if (!finalTarefaId && novaTarefa?.titulo && novaTarefa?.areaId) {
    const criada = await prisma.tarefa.create({
      data: {
        titulo:       novaTarefa.titulo,
        descricao:    novaTarefa.descricao ?? null,
        areaId:       novaTarefa.areaId,
        periodicidade: "MENSAL",
      },
    });
    finalTarefaId = criada.id;
  }

  if (!finalTarefaId) {
    return NextResponse.json({ error: "tarefaId ou novaTarefa são obrigatórios" }, { status: 400 });
  }

  const item = await prisma.escalaItem.create({
    data: {
      tarefaId: finalTarefaId,
      userId,
      dataInicio,
      dataFim,
      diasSemana: Array.isArray(diasSemana) ? diasSemana : [],
      modoDias: modoDias === "UM_DENTRE" ? "UM_DENTRE" : "TODOS",
    },
    include: {
      tarefa: { include: { area: { select: { nome: true } } } },
      responsavel: { select: { id: true, nome: true, cor: true } },
    },
  });

  return NextResponse.json(item, { status: 201 });
}
