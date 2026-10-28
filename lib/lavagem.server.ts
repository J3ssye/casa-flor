import { Prisma, PrismaClient } from "@prisma/client";
import {
  excecoesParaTemporaria,
  formatDataUTC,
  ehDataPassada,
  MAX_POR_DIA,
  type StatusTroca,
} from "@/lib/lavagem";

// ─────────────────────────────────────────────
// Efeitos de transição no banco (server-only).
// Usado tanto pela criação (auto-aprovação) quanto pelo PATCH (admin).
// A lógica pura/validações ficam em lib/lavagem.ts.
// ─────────────────────────────────────────────

/** Erro de negócio com status HTTP associado (aborta a transação). */
export class ErroTroca extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

type Tx = Prisma.TransactionClient;
type Solicitacao = Prisma.SolicitacaoTrocaLavagemGetPayload<{}>;

/**
 * Aprova uma solicitação PENDENTE: aplica o efeito (base/exceção) e grava a transição.
 * Lança ErroTroca quando não é possível aprovar (dia cheio, escala mudou, inativa…).
 */
export async function aprovarSolicitacao(
  db: PrismaClient,
  solicitacaoId: string,
  autorId: string,
  opts?: { motivo?: string },
): Promise<void> {
  try {
    await db.$transaction(async (tx) => {
      const atual = await tx.solicitacaoTrocaLavagem.findUnique({ where: { id: solicitacaoId } });
      if (!atual || atual.status !== "PENDENTE") {
        throw new ErroTroca(409, "Esta solicitação já foi finalizada.");
      }
      await aplicarAprovacao(tx, atual);
      await tx.solicitacaoTrocaLavagem.update({ where: { id: solicitacaoId }, data: { status: "APROVADA" } });
      await tx.transicaoTrocaLavagem.create({
        data: { solicitacaoId, deStatus: "PENDENTE", paraStatus: "APROVADA", autorId, motivo: opts?.motivo ?? null },
      });
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      throw new ErroTroca(409, `Este dia já tem ${MAX_POR_DIA} moradoras. Recuse o pedido ou libere um lugar.`);
    }
    throw e;
  }
}

/** Recusa ou cancela uma solicitação PENDENTE (sem efeito na escala). */
export async function finalizarSolicitacao(
  db: PrismaClient,
  solicitacaoId: string,
  novoStatus: Extract<StatusTroca, "RECUSADA" | "CANCELADA">,
  autorId: string,
  motivo?: string | null,
): Promise<void> {
  await db.$transaction(async (tx) => {
    const atual = await tx.solicitacaoTrocaLavagem.findUnique({ where: { id: solicitacaoId } });
    if (!atual || atual.status !== "PENDENTE") {
      throw new ErroTroca(409, "Esta solicitação já foi finalizada.");
    }
    await tx.solicitacaoTrocaLavagem.update({ where: { id: solicitacaoId }, data: { status: novoStatus } });
    await tx.transicaoTrocaLavagem.create({
      data: { solicitacaoId, deStatus: "PENDENTE", paraStatus: novoStatus, autorId, motivo: motivo ?? null },
    });
  });
}

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
