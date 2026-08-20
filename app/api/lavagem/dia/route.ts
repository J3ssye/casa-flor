import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/permissions";
import { parseDataUTC, diaSemanaUTC, rosterEfetivo } from "@/lib/lavagem";

/**
 * GET /api/lavagem/dia?data=YYYY-MM-DD
 * Roster efetivo do dia: escala base do dia-da-semana, com as exceções aplicadas.
 */
export async function GET(req: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  const dataStr = new URL(req.url).searchParams.get("data");
  if (!dataStr || !/^\d{4}-\d{2}-\d{2}$/.test(dataStr)) {
    return NextResponse.json({ error: "Parâmetro 'data' (YYYY-MM-DD) é obrigatório." }, { status: 400 });
  }

  const data = parseDataUTC(dataStr);
  const diaSemana = diaSemanaUTC(data);

  const [base, excecoes] = await Promise.all([
    prisma.escalaLavagem.findMany({
      where: { diaSemana },
      select: { userId: true, slot: true },
    }),
    prisma.excecaoLavagem.findMany({
      where: { data },
      select: { userId: true, acao: true },
    }),
  ]);

  const userIds = rosterEfetivo(base, excecoes);

  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, nome: true, cor: true },
  });
  const porId = new Map(users.map(u => [u.id, u]));

  return NextResponse.json({
    data: dataStr,
    diaSemana,
    temExcecao: excecoes.length > 0,
    moradoras: userIds.map(id => porId.get(id)).filter(Boolean),
  });
}
