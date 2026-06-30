import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/permissions";

/**
 * GET /api/moradoras/ativas
 * Lista mínima (id + nome) das moradoras ativas — liberada para QUALQUER login.
 * Usada, por exemplo, para dividir o gás no financeiro da moradora.
 * (Diferente de /api/moradoras, que é só de administradora e traz dados sensíveis.)
 */
export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  const moradoras = await prisma.user.findMany({
    where: { ativo: true },
    select: { id: true, nome: true },
    orderBy: { nome: "asc" },
  });

  return NextResponse.json(moradoras);
}
