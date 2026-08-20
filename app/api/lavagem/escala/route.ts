import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireAdmin } from "@/lib/permissions";
import { MAX_POR_DIA } from "@/lib/lavagem";

/** GET /api/lavagem/escala — escala base recorrente (todas veem). */
export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  const itens = await prisma.escalaLavagem.findMany({
    orderBy: [{ diaSemana: "asc" }, { slot: "asc" }],
    include: { user: { select: { id: true, nome: true, cor: true } } },
  });

  return NextResponse.json(itens);
}

/**
 * POST /api/lavagem/escala — admin aloca uma moradora num dia.
 * Body: { userId, diaSemana }  (slot é atribuído automaticamente: 0 ou 1)
 * Limite de 2/dia garantido pela constraint @@unique([diaSemana, slot]).
 */
export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { userId, diaSemana } = await req.json();

  if (typeof userId !== "string" || !userId) {
    return NextResponse.json({ error: "userId é obrigatório" }, { status: 400 });
  }
  if (!Number.isInteger(diaSemana) || diaSemana < 0 || diaSemana > 6) {
    return NextResponse.json({ error: "diaSemana deve ser 0–6" }, { status: 400 });
  }

  const usados = await prisma.escalaLavagem.findMany({
    where: { diaSemana },
    select: { slot: true, userId: true },
  });

  if (usados.some(u => u.userId === userId)) {
    return NextResponse.json({ error: "Esta moradora já está escalada neste dia." }, { status: 409 });
  }

  const ocupados = new Set(usados.map(u => u.slot));
  const livres = Array.from({ length: MAX_POR_DIA }, (_, i) => i).filter(s => !ocupados.has(s));

  if (livres.length === 0) {
    return NextResponse.json(
      { error: `Este dia já tem ${MAX_POR_DIA} moradoras. Remova uma antes de adicionar outra.` },
      { status: 409 },
    );
  }

  // Tenta os slots livres em ordem; a constraint resolve corrida entre dois admins.
  for (const slot of livres) {
    try {
      const criada = await prisma.escalaLavagem.create({
        data: { userId, diaSemana, slot },
        include: { user: { select: { id: true, nome: true, cor: true } } },
      });
      return NextResponse.json(criada, { status: 201 });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") continue;
      throw e;
    }
  }

  return NextResponse.json(
    { error: `Este dia já tem ${MAX_POR_DIA} moradoras.` },
    { status: 409 },
  );
}
