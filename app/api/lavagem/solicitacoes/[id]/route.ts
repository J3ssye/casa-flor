import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/permissions";
import {
  checarTransicao,
  excecoesParaTemporaria,
  formatDataUTC,
  ehDataPassada,
  MAX_POR_DIA,
  type StatusTroca,
} from "@/lib/lavagem";

/** Erro de negócio com status HTTP associado (abortando a transação). */
class ErroTroca extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

const ACAO_STATUS: Record<string, StatusTroca> = {
  aprovar: "APROVADA",
  recusar: "RECUSADA",
  cancelar: "CANCELADA",
};

/**
 * PATCH /api/lavagem/solicitacoes/[id]
 * Body: { acao: "aprovar" | "recusar" | "cancelar", motivo? }
 *  • cancelar: apenas a própria solicitante, só enquanto PENDENTE
 *  • aprovar/recusar: apenas ADMIN, só enquanto PENDENTE
 */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { session, error } = await requireAuth();
  if (error || !session) return error!;

  const body = await req.json();
  const novoStatus = ACAO_STATUS[body.acao];
  if (!novoStatus) {
    return NextResponse.json({ error: "Ação inválida." }, { status: 400 });
  }

  const sol = await prisma.solicitacaoTrocaLavagem.findUnique({ where: { id: params.id } });
  if (!sol) return NextResponse.json({ error: "Solicitação não encontrada." }, { status: 404 });

  const papel = session.user.role === "ADMIN" ? "ADMIN" : "MORADORA";
  const ehDono = sol.solicitanteId === session.user.id;

  const permitido = checarTransicao({
    statusAtual: sol.status as StatusTroca,
    novoStatus,
    papel,
    ehDono,
  });
  if (!permitido.ok) {
    // 403 quando é questão de permissão; 409 quando o estado não permite mais
    const status = sol.status !== "PENDENTE" ? 409 : 403;
    return NextResponse.json({ error: permitido.erro }, { status });
  }

  try {
    await prisma.$transaction(async (tx) => {
      // Recarrega dentro da transação e trava logicamente via status atual
      const atual = await tx.solicitacaoTrocaLavagem.findUnique({ where: { id: sol.id } });
      if (!atual || atual.status !== "PENDENTE") {
        throw new ErroTroca(409, "Esta solicitação já foi finalizada.");
      }

      if (novoStatus === "APROVADA") {
        await aplicarAprovacao(tx, atual);
      }

      await tx.solicitacaoTrocaLavagem.update({
        where: { id: sol.id },
        data: { status: novoStatus },
      });
      await tx.transicaoTrocaLavagem.create({
        data: {
          solicitacaoId: sol.id,
          deStatus: "PENDENTE",
          paraStatus: novoStatus,
          autorId: session.user.id,
          motivo: body.motivo ?? null,
        },
      });
    });
  } catch (e) {
    if (e instanceof ErroTroca) return NextResponse.json({ error: e.message }, { status: e.status });
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json(
        { error: `Este dia já tem ${MAX_POR_DIA} moradoras. Recuse o pedido ou libere um lugar.` },
        { status: 409 },
      );
    }
    throw e;
  }

  const completa = await prisma.solicitacaoTrocaLavagem.findUnique({
    where: { id: sol.id },
    include: {
      solicitante: { select: { id: true, nome: true, cor: true } },
      contraparte: { select: { id: true, nome: true, cor: true } },
      transicoes: {
        orderBy: { criadoEm: "asc" },
        include: { autor: { select: { id: true, nome: true } } },
      },
    },
  });
  return NextResponse.json(completa);
}

type Tx = Prisma.TransactionClient;
type Solicitacao = Prisma.SolicitacaoTrocaLavagemGetPayload<{}>;

/** Efeito da aprovação: muda a base (permanente) ou grava exceção do dia (temporária). */
async function aplicarAprovacao(tx: Tx, s: Solicitacao) {
  // D6: bloqueia se solicitante/contraparte inativa
  const ids = [s.solicitanteId, s.contraparteId].filter(Boolean) as string[];
  const users = await tx.user.findMany({ where: { id: { in: ids } }, select: { id: true, ativo: true } });
  if (users.some(u => !u.ativo) || users.length !== ids.length) {
    throw new ErroTroca(409, "Há uma moradora inativa nesta solicitação. Não é possível aprovar.");
  }

  if (s.tipo === "PERMANENTE") {
    await aprovarPermanente(tx, s);
  } else {
    await aprovarTemporaria(tx, s);
  }
}

async function aprovarPermanente(tx: Tx, s: Solicitacao) {
  const { solicitanteId, contraparteId, diaOrigem, diaDesejado } = s;
  if (diaDesejado == null) throw new ErroTroca(400, "Dia desejado ausente na solicitação.");

  if (contraparteId) {
    // Permuta: solicitante (diaOrigem) ⇄ contraparte (diaDesejado)
    if (diaOrigem == null) throw new ErroTroca(400, "Dia de origem ausente na solicitação.");

    const rowA = await tx.escalaLavagem.findFirst({ where: { diaSemana: diaOrigem, userId: solicitanteId } });
    const rowB = await tx.escalaLavagem.findFirst({ where: { diaSemana: diaDesejado, userId: contraparteId } });
    if (!rowA || !rowB) {
      throw new ErroTroca(409, "A escala mudou desde o pedido; a permuta não é mais possível.");
    }
    // Bloqueia se o destino da permuta criaria duplicidade no mesmo dia
    const conflitoA = await tx.escalaLavagem.findFirst({ where: { diaSemana: diaOrigem, userId: contraparteId } });
    const conflitoB = await tx.escalaLavagem.findFirst({ where: { diaSemana: diaDesejado, userId: solicitanteId } });
    if (conflitoA || conflitoB) {
      throw new ErroTroca(409, "Uma das moradoras já está escalada no dia de destino da permuta.");
    }
    await tx.escalaLavagem.update({ where: { id: rowA.id }, data: { userId: contraparteId } });
    await tx.escalaLavagem.update({ where: { id: rowB.id }, data: { userId: solicitanteId } });
    return;
  }

  // Sem contraparte: mover/alocar a solicitante para o dia desejado
  const jaNoDestino = await tx.escalaLavagem.findFirst({ where: { diaSemana: diaDesejado, userId: solicitanteId } });
  if (jaNoDestino) throw new ErroTroca(409, "Você já está escalada nesse dia.");

  const usados = await tx.escalaLavagem.findMany({ where: { diaSemana: diaDesejado }, select: { slot: true } });
  const ocupados = new Set(usados.map(u => u.slot));
  const slotLivre = Array.from({ length: MAX_POR_DIA }, (_, i) => i).find(sl => !ocupados.has(sl));
  if (slotLivre === undefined) {
    throw new ErroTroca(409, `O dia desejado já tem ${MAX_POR_DIA} moradoras.`);
  }

  const origem = diaOrigem != null
    ? await tx.escalaLavagem.findFirst({ where: { diaSemana: diaOrigem, userId: solicitanteId } })
    : null;

  if (origem) {
    await tx.escalaLavagem.update({
      where: { id: origem.id },
      data: { diaSemana: diaDesejado, slot: slotLivre },
    });
  } else {
    await tx.escalaLavagem.create({
      data: { userId: solicitanteId, diaSemana: diaDesejado, slot: slotLivre },
    });
  }
}

async function aprovarTemporaria(tx: Tx, s: Solicitacao) {
  if (!s.dataAlvo) throw new ErroTroca(400, "Data-alvo ausente na solicitação.");

  const dataStr = formatDataUTC(s.dataAlvo);
  if (ehDataPassada(dataStr, formatDataUTC(new Date()))) {
    throw new ErroTroca(409, "A data desta troca já passou.");
  }

  const deltas = excecoesParaTemporaria({ solicitanteId: s.solicitanteId, contraparteId: s.contraparteId });

  // Exceção não tem cap de 2 — troca temporária pode exceder. Upsert por (data, userId).
  for (const d of deltas) {
    await tx.excecaoLavagem.upsert({
      where: { data_userId: { data: s.dataAlvo, userId: d.userId } },
      create: { data: s.dataAlvo, userId: d.userId, acao: d.acao, solicitacaoId: s.id },
      update: { acao: d.acao, solicitacaoId: s.id },
    });
  }
}
