import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/permissions";
import { checarTransicao, type StatusTroca } from "@/lib/lavagem";
import { aprovarSolicitacao, finalizarSolicitacao, ErroTroca } from "@/lib/lavagem.server";

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
 *
 * Observação: a maioria das solicitações já nasce APROVADA (auto-aprovação na
 * criação). Esta rota trata os casos que sobraram PENDENTE — tipicamente
 * permanentes que não couberam no dia e aguardam a administradora.
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

  const permitido = checarTransicao({ statusAtual: sol.status as StatusTroca, novoStatus, papel, ehDono });
  if (!permitido.ok) {
    const status = sol.status !== "PENDENTE" ? 409 : 403;
    return NextResponse.json({ error: permitido.erro }, { status });
  }

  try {
    if (novoStatus === "APROVADA") {
      await aprovarSolicitacao(prisma, sol.id, session.user.id, { motivo: body.motivo });
    } else {
      await finalizarSolicitacao(prisma, sol.id, novoStatus as "RECUSADA" | "CANCELADA", session.user.id, body.motivo);
    }
  } catch (e) {
    if (e instanceof ErroTroca) return NextResponse.json({ error: e.message }, { status: e.status });
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
