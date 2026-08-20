import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/permissions";
import { validarNovaSolicitacao, formatDataUTC, parseDataUTC } from "@/lib/lavagem";

const INCLUDE = {
  solicitante: { select: { id: true, nome: true, cor: true } },
  contraparte: { select: { id: true, nome: true, cor: true } },
  transicoes: {
    orderBy: { criadoEm: "asc" as const },
    include: { autor: { select: { id: true, nome: true } } },
  },
};

/** GET /api/lavagem/solicitacoes — admin vê todas; moradora vê as que a envolvem. */
export async function GET() {
  const { session, error } = await requireAuth();
  if (error || !session) return error!;

  const isAdmin = session.user.role === "ADMIN";
  const where = isAdmin
    ? {}
    : { OR: [{ solicitanteId: session.user.id }, { contraparteId: session.user.id }] };

  const itens = await prisma.solicitacaoTrocaLavagem.findMany({
    where,
    orderBy: { criadoEm: "desc" },
    include: INCLUDE,
  });

  return NextResponse.json(itens);
}

/**
 * POST /api/lavagem/solicitacoes — moradora cria uma solicitação.
 * Body: { tipo, contraparteId?, diaOrigem?, diaDesejado?, dataAlvo? }
 * Regras: payload válido, 1 pendente por tipo, contraparte válida/ativa.
 */
export async function POST(req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error || !session) return error!;

  const body = await req.json();
  const hoje = formatDataUTC(new Date());

  const valido = validarNovaSolicitacao(body, hoje);
  if (!valido.ok) return NextResponse.json({ error: valido.erro }, { status: 400 });

  const solicitanteId = session.user.id;
  const contraparteId: string | null = body.contraparteId || null;

  if (contraparteId) {
    if (contraparteId === solicitanteId) {
      return NextResponse.json({ error: "A contraparte não pode ser você mesma." }, { status: 400 });
    }
    const cp = await prisma.user.findUnique({ where: { id: contraparteId }, select: { ativo: true } });
    if (!cp || !cp.ativo) {
      return NextResponse.json({ error: "Contraparte inválida ou inativa." }, { status: 400 });
    }
  }

  // 1 pendente por tipo (regra de aplicação — o limite crítico de 2/dia é do banco)
  const jaPendente = await prisma.solicitacaoTrocaLavagem.findFirst({
    where: { solicitanteId, tipo: body.tipo, status: "PENDENTE" },
    select: { id: true },
  });
  if (jaPendente) {
    return NextResponse.json(
      { error: "Você já tem uma solicitação deste tipo em aberto. Cancele-a antes de criar outra." },
      { status: 409 },
    );
  }

  const criada = await prisma.$transaction(async (tx) => {
    const s = await tx.solicitacaoTrocaLavagem.create({
      data: {
        tipo: body.tipo,
        solicitanteId,
        contraparteId,
        diaOrigem: body.diaOrigem ?? null,
        diaDesejado: body.diaDesejado ?? null,
        dataAlvo: body.dataAlvo ? parseDataUTC(body.dataAlvo) : null,
        observacao: body.observacao ?? null,
      },
    });
    await tx.transicaoTrocaLavagem.create({
      data: { solicitacaoId: s.id, deStatus: null, paraStatus: "PENDENTE", autorId: solicitanteId },
    });
    return s;
  });

  const completa = await prisma.solicitacaoTrocaLavagem.findUnique({
    where: { id: criada.id },
    include: INCLUDE,
  });
  return NextResponse.json(completa, { status: 201 });
}
