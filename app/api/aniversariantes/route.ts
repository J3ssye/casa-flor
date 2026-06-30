import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/permissions";

/**
 * GET /api/aniversariantes
 * Lista as moradoras ativas com data de nascimento — liberada para qualquer login.
 * Usada pelo Mural de Aniversariantes.
 */
export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  const moradoras = await prisma.user.findMany({
    where: { ativo: true },
    select: { id: true, nome: true, cor: true, dataNascimento: true },
    orderBy: { nome: "asc" },
  });

  return NextResponse.json(moradoras);
}
